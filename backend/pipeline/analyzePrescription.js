import { extractPrescription, explainFindings } from '../services/groq.js';
import { normalizeDrug } from '../services/rxnorm.js';
import { getDrugClasses } from '../services/rxclass.js';
import { getDrugLabel } from '../services/openfda.js';
import { checkAllergies } from '../safety/allergy.js';
import { checkDrugDrug } from '../safety/drugDrug.js';
import { checkDuplicateTherapy } from '../safety/duplicateTherapy.js';
import { checkDrugDisease } from '../safety/drugDisease.js';
import { checkDose } from '../safety/doseCheck.js';
import { cleanDrugName } from '../utils/normalize.js';

const CHECKS = [checkAllergies, checkDrugDrug, checkDuplicateTherapy, checkDrugDisease, checkDose];

/** Accepts both API-shaped ({frequency, duration}) and UI-shaped ({freq, intendedDuration}) medications. */
function toMedication(med = {}) {
  return {
    id: med.id,
    name: cleanDrugName(med.name),
    dose: med.dose ?? '',
    frequency: med.frequency ?? med.freq ?? '',
    route: med.route ?? '',
    duration: med.duration ?? med.intendedDuration ?? '',
  };
}

// Bounded LRU cache (max 150 items) so instances don't leak memory indefinitely.
const MAX_CACHE_SIZE = 150;
const lookupCache = new Map();

function cached(key, load) {
  if (lookupCache.has(key)) {
    const val = lookupCache.get(key);
    lookupCache.delete(key);
    lookupCache.set(key, val);
    return val;
  }

  const promise = load()
    .then((result) => {
      // Do not permanently retain empty or failed resolution results
      if (!result || (typeof result === 'object' && !result.rxCui && !result.label && (!result.classes || result.classes.length === 0))) {
        lookupCache.delete(key);
      }
      return result;
    })
    .catch((error) => {
      lookupCache.delete(key);
      throw error;
    });

  if (lookupCache.size >= MAX_CACHE_SIZE) {
    const firstKey = lookupCache.keys().next().value;
    if (firstKey) lookupCache.delete(firstKey);
  }

  lookupCache.set(key, promise);
  return promise;
}

async function enrich(med, warnings) {
  const key = med.name.toLowerCase();
  const info = {
    ...med,
    rxCui: null,
    ingredientRxCui: null,
    ingredientName: med.name,
    ingredients: [{ rxCui: null, name: med.name }],
    classes: [],
    label: null,
    classLookupFailed: false,
    labelLookupFailed: false,
  };

  try {
    const norm = await cached(`rxnorm:${key}`, () => normalizeDrug(med.name));
    Object.assign(info, norm);
  } catch (error) {
    warnings.push(`Could not normalize "${med.name}" with RxNorm (${error.message}).`);
  }

  try {
    if (info.ingredientRxCui) {
      info.classes = await cached(`rxclass:${info.ingredientRxCui}`, () => getDrugClasses(info.ingredientRxCui));
    }
  } catch (error) {
    warnings.push(`Drug class lookup failed for "${med.name}" (${error.message}).`);
    info.classLookupFailed = true;
  }

  try {
    const candidates = [info.ingredientName, med.name, ...(info.ingredients ?? []).map((i) => i.name)];
    info.label = await cached(`label:${key}`, () => getDrugLabel(candidates));
  } catch (error) {
    warnings.push(`FDA label lookup failed for "${med.name}" (${error.message}).`);
    info.labelLookupFailed = true;
  }

  return info;
}

/** Publicly visible medication shape (no label payload). */
function publicMed({ label, classes, ...rest }) {
  return { ...rest, classes, labelAvailable: Boolean(label) };
}

/** Step 1: text -> structured, normalized medications. */
export async function extractMedications(prescription = '') {
  if (!prescription || typeof prescription !== 'string' || !prescription.trim()) {
    throw new Error('Prescription text is required');
  }

  const extracted = await extractPrescription(prescription);
  const warnings = [];
  const meds = await Promise.all(extracted.medications.map((m) => enrich(toMedication(m), warnings)));

  return { medications: meds.map(publicMed), warnings };
}

/** Step 2: run deterministic safety checks, then enrich with AI explanations. */
export async function analyzeSafety({ patient = {}, medications = [] }) {
  const warnings = [];
  const requested = medications.map(toMedication).filter((m) => m.name);
  if (requested.length === 0) throw new Error('At least one medication is required');

  const [newMeds, currentMeds] = await Promise.all([
    Promise.all(requested.map((m) => enrich(m, warnings))),
    Promise.all((patient.currentMeds ?? []).map((m) => enrich(toMedication(m), warnings))),
  ]);

  const context = { patient, newMeds, currentMeds };

  // Never let an unhandled check exception silently produce "safe"
  const results = await Promise.all(
    CHECKS.map(async (check) => {
      try {
        return await check(context);
      } catch (error) {
        const checkName = check.name.replace(/^check/, '');
        warnings.push(`${checkName} check failed: ${error.message}`);
        return [
          {
            category: 'Safety Coverage',
            severity: 'review',
            title: `Could not complete ${checkName} check`,
            summary: `Automated ${checkName} safety checking could not run completely due to an error: ${error.message}. This check must be verified manually.`,
            affectedMeds: newMeds.map((m) => `${m.name} (New)`),
            evidenceSource: 'MediGuard Safety Engine',
            evidence: [{ source: 'System Notice', snippet: `Check failed: ${error.message}` }],
            action: 'Review this safety aspect manually with standard references before dispensing.',
          },
        ];
      }
    })
  );

  const findings = results.flat();

  // Check if any CURRENT medications could not be resolved or lack FDA labels
  // An unresolved current medication prevents complete drug-drug interaction checking
  const unresolvedCurrent = currentMeds.filter((m) => !m.label);
  for (const cur of unresolvedCurrent) {
    findings.push({
      category: 'Data Coverage',
      severity: 'review',
      title: `Could not check interactions with current med: ${cur.name}`,
      summary: `No FDA drug label was found for your current medication ${cur.name}. Automated drug-drug interaction and duplicate therapy checks between new prescriptions and ${cur.name} could not be completed.`,
      affectedMeds: [`${cur.name} (Current)`],
      evidenceSource: 'openFDA drug label lookup',
      evidence: [],
      action: 'Confirm drug-drug interactions between your new medication and this medicine with your pharmacist.',
    });
  }

  // Evaluate new medications:
  // "Safe" must NEVER be the failure state.
  for (const med of newMeds) {
    const label = `${med.name} (New)`;
    const medFindings = findings.filter((f) => f.affectedMeds?.includes(label));
    const hasHighOrReview = medFindings.some((f) => f.severity === 'high' || f.severity === 'review');

    if (!med.label) {
      findings.push({
        category: 'Data Coverage',
        severity: 'review',
        title: `Could not verify: No FDA label for ${med.name}`,
        summary: `No matching FDA drug label was found for "${med.name}". Automated label checks (drug-drug interactions, contraindications, dosage limits) could not run.`,
        affectedMeds: [label],
        evidenceSource: 'openFDA drug label lookup',
        evidence: [],
        action: 'Check this medication manually against a trusted drug reference.',
      });
    } else if (med.classLookupFailed) {
      findings.push({
        category: 'Data Coverage',
        severity: 'review',
        title: `Could not verify drug class for ${med.name}`,
        summary: `RxClass lookup for ${med.name} was unavailable. Class-based allergy cross-reactivity and duplicate therapy checks could not be fully completed.`,
        affectedMeds: [label],
        evidenceSource: 'RxClass drug classification',
        evidence: [],
        action: 'Review drug class and potential cross-reactivities manually.',
      });
    } else if (!hasHighOrReview && unresolvedCurrent.length === 0) {
      // ONLY emit green "safe" card if:
      // 1. Drug label was found and analyzed.
      // 2. Class lookup succeeded.
      // 3. All current medications were resolved and checked.
      // 4. No high or review findings exist for this medication.
      findings.push({
        category: 'General Safety',
        severity: 'safe',
        title: `No flagged conflicts found for ${med.name}`,
        summary: `No allergy, interaction, duplicate-therapy, drug-disease or dose conflicts were detected for ${med.name} in the available FDA label and clinical classification records. This check is not a guarantee of individual safety.`,
        affectedMeds: [label],
        evidenceSource: 'openFDA drug label; RxNorm; RxClass',
        evidence: [],
        action: 'Proceed with routine clinical judgement.',
      });
    }
  }

  findings.forEach((f, i) => {
    f.id = `f${i + 1}`;
  });

  // Plain-language explanations via Groq. Failure here must not lose the findings.
  const explainable = findings.filter((f) => f.severity !== 'safe');
  if (explainable.length > 0) {
    try {
      const { explanations } = await explainFindings({
        patient: {
          age: patient.age,
          sex: patient.sex,
          allergies: patient.allergies?.map((a) => a.name),
          diagnoses: patient.diagnoses?.map((d) => d.name),
        },
        findings: explainable.map(({ id, category, severity, title, summary, affectedMeds, evidence }) => ({
          id, category, severity, title, summary, affectedMeds, evidence,
        })),
      });
      for (const e of explanations) {
        const finding = findings.find((f) => f.id === e.id);
        if (finding) {
          finding.mechanism = e.mechanism || undefined;
          finding.clinicalConsiderations = e.clinicalConsiderations || undefined;
        }
      }
    } catch (error) {
      warnings.push(`AI explanations unavailable (${error.message}). Findings below come directly from verified source data.`);
    }
  }

  for (const f of findings) {
    f.clinicalConsiderations ??= 'Review the cited source text together with the patient’s full clinical context.';
  }

  const count = (s) => findings.filter((f) => f.severity === s).length;
  return {
    patient,
    medications: newMeds.map(publicMed),
    findings,
    summary: { high: count('high'), review: count('review'), safe: count('safe') },
    checksPerformed: CHECKS.length,
    warnings,
    status: 'analysis-complete',
  };
}

/** One-shot helper: prescription text in, full analysis out. */
export async function analyzePrescription({ patient = {}, prescription = '', medications }) {
  const meds = Array.isArray(medications) && medications.length > 0
    ? medications
    : (await extractMedications(prescription)).medications;
  return analyzeSafety({ patient, medications: meds });
}
