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

// Reference lookups are the same for every request, so keep them for the life of the instance.
const lookupCache = new Map();
function cached(key, load) {
  if (!lookupCache.has(key)) {
    lookupCache.set(
      key,
      load().catch((error) => {
        lookupCache.delete(key);
        throw error;
      })
    );
  }
  return lookupCache.get(key);
}

async function enrich(med, warnings) {
  const key = med.name.toLowerCase();
  const info = { ...med, rxCui: null, ingredientRxCui: null, ingredientName: med.name, classes: [], label: null };

  try {
    Object.assign(info, await cached(`rxnorm:${key}`, () => normalizeDrug(med.name)));
  } catch (error) {
    warnings.push(`Could not normalize "${med.name}" with RxNorm (${error.message}).`);
  }

  info.classes = await cached(`rxclass:${info.ingredientRxCui}`, () => getDrugClasses(info.ingredientRxCui));

  try {
    info.label = await cached(`label:${key}`, () => getDrugLabel([info.ingredientName, med.name]));
  } catch (error) {
    warnings.push(`FDA label lookup failed for "${med.name}" (${error.message}).`);
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

/** Step 2: run the deterministic safety checks, then ask the LLM to explain them. */
export async function analyzeSafety({ patient = {}, medications = [] }) {
  const warnings = [];
  const requested = medications.map(toMedication).filter((m) => m.name);
  if (requested.length === 0) throw new Error('At least one medication is required');

  const [newMeds, currentMeds] = await Promise.all([
    Promise.all(requested.map((m) => enrich(m, warnings))),
    Promise.all((patient.currentMeds ?? []).map((m) => enrich(toMedication(m), warnings))),
  ]);

  const context = { patient, newMeds, currentMeds };
  const results = await Promise.all(
    CHECKS.map((check) =>
      check(context).catch((error) => {
        warnings.push(`${check.name} failed: ${error.message}`);
        return [];
      })
    )
  );

  const findings = results.flat();

  // Never report "safe" for something we could not check.
  for (const med of newMeds) {
    const label = `${med.name} (New)`;
    if (!med.label) {
      findings.push({
        category: 'Data Coverage',
        severity: 'review',
        title: `No FDA label found for ${med.name}`,
        summary: `No matching FDA drug label was found for ${med.name}, so label-based checks (interactions, contraindications, dose limits) could not run for it.`,
        affectedMeds: [label],
        evidenceSource: 'openFDA drug label lookup',
        evidence: [],
        action: 'Check this medication manually against a trusted reference.',
      });
    } else if (!findings.some((f) => f.affectedMeds?.includes(label))) {
      findings.push({
        category: 'General Safety',
        severity: 'safe',
        title: `No conflicts found for ${med.name}`,
        summary: `No allergy, interaction, duplicate-therapy, drug-disease or dose conflicts were found for ${med.name} in the sources checked (FDA label text, RxClass). This is not a guarantee of safety.`,
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

  // Plain-language explanations. Failure here must not lose the findings.
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
      warnings.push(`AI explanations unavailable (${error.message}). Findings below come directly from the source data.`);
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
