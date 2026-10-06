import { extractPrescription, explainFindings } from '../services/groq.js';
import { normalizeDrug } from '../services/rxnorm.js';
import { getDrugClasses } from '../services/rxclass.js';
import { getDrugLabelEvidence } from '../services/openfda.js';
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
  const info = {
    ...med,
    status: 'unresolved',
    rxCui: null,
    ingredientRxCui: null,
    ingredientName: null,
    classes: [],
    label: null,
    labelEvidence: { status: 'unavailable', reason: 'Medication has not been normalized.' },
    normalization: { status: 'unresolved', reason: 'Medication has not been normalized.' },
  };

  try {
    Object.assign(info, await cached(`rxnorm:${key}`, () => normalizeDrug(med.name)));
  } catch (error) {
    warnings.push(`Could not normalize "${med.name}" with RxNorm (${error.message}).`);
    info.normalization = { status: 'unresolved', reason: 'RxNorm lookup failed.' };
  }

  if (info.status !== 'resolved' || !info.ingredientRxCui) {
    return info;
  }

  try {
    info.classes = await cached(`rxclass:${info.ingredientRxCui}`, () => getDrugClasses(info.ingredientRxCui));
  } catch (error) {
    warnings.push(`Drug class lookup failed for "${med.name}" (${error.message}).`);
  }

  try {
    info.labelEvidence = await cached(
      `label:${key}|route:${String(med.route ?? '').toLowerCase().trim()}`,
      () => getDrugLabelEvidence({
        ingredientName: info.ingredientName,
        inputName: med.name,
        route: med.route,
        dose: med.dose,
      })
    );
    info.label = info.labelEvidence?.label ?? null;
    if (!info.label) {
      info.labelEvidence = {
        status: 'unavailable',
        reason: info.labelEvidence?.reason ?? 'No suitable FDA label was found.',
        candidates: info.labelEvidence?.candidates ?? [],
        selection: info.labelEvidence?.selection ?? null,
      };
    }
  } catch (error) {
    warnings.push(`FDA label lookup failed for "${med.name}" (${error.message}).`);
    info.label = null;
    info.labelEvidence = { status: 'unavailable', reason: 'FDA label lookup failed.' };
  }
  return info;
}

/** Publicly visible medication shape (no label payload). */
function publicMed({ label, classes, ...rest }) {
  return { ...rest, classes, labelAvailable: Boolean(label) };
}

function checkResult(result) {
  if (Array.isArray(result)) return { findings: result, state: 'passed' };
  if (result && Array.isArray(result.findings)) {
    return {
      findings: result.findings,
      state: ['passed', 'not_applicable', 'unable_to_check'].includes(result.state) ? result.state : 'passed',
      reason: result.reason,
    };
  }
  throw new Error('Safety check returned an invalid result');
}

export async function executeSafetyChecks(context, checks = CHECKS) {
  return Promise.all(checks.map(async (check) => {
    const name = check.name || 'unnamed_check';
    try {
      const result = checkResult(await check(context));
      return { name, ...result };
    } catch (error) {
      return {
        name,
        findings: [],
        state: 'failed',
        reason: 'The check encountered an internal error and did not complete.',
        error,
      };
    }
  }));
}

function unableFinding(med, title, summary, source, evidence) {
  return {
    category: 'Data Coverage',
    severity: 'review',
    title,
    summary,
    affectedMeds: [`${med.name} (New)`],
    evidenceSource: source,
    evidence: evidence ? [{ source, snippet: evidence }] : [],
    action: 'Confirm the medication and complete the safety review using a trusted clinical reference.',
  };
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
export async function analyzeSafety({ patient = {}, medications = [], checks = CHECKS }) {
  const warnings = [];
  const requested = medications.map(toMedication).filter((m) => m.name);
  if (requested.length === 0) throw new Error('At least one medication is required');

  const [newMeds, currentMeds] = await Promise.all([
    Promise.all(requested.map((m) => enrich(m, warnings))),
    Promise.all((patient.currentMeds ?? []).map((m) => enrich(toMedication(m), warnings))),
  ]);

  // Unresolved names never enter identity-dependent checks as though they had been
  // identified. Their state is surfaced below instead.
  const resolvedNewMeds = newMeds.filter((med) => med.status === 'resolved');
  const resolvedCurrentMeds = currentMeds.filter((med) => med.status === 'resolved');
  const unresolvedCurrentMeds = currentMeds.filter((med) => med.status !== 'resolved');
  const context = { patient, newMeds: resolvedNewMeds, currentMeds: resolvedCurrentMeds };
  const checkStatuses = await executeSafetyChecks(context, checks);
  const findings = checkStatuses.flatMap((result) => result.findings);

  for (const med of unresolvedCurrentMeds) {
    findings.push({
      category: 'Data Coverage',
      severity: 'review',
      title: `Unable to identify current medication ${med.name}`,
      summary: `RxNorm could not identify the current medication ${med.name} with enough certainty. Interaction and duplicate-therapy checks involving it are incomplete.`,
      affectedMeds: [`${med.name} (Current)`],
      evidenceSource: 'RxNorm medication normalization',
      evidence: [],
      action: 'Confirm this current medication before relying on the safety review.',
    });
  }

  for (const result of checkStatuses.filter((result) => result.state === 'failed')) {
    warnings.push(`${result.name} failed: ${result.error?.message ?? result.reason}`);
  }

  // Never report "safe" for something we could not check.
  for (const med of newMeds) {
    const label = `${med.name} (New)`;
    if (med.status !== 'resolved') {
      findings.push(unableFinding(
        med,
        `Unable to identify ${med.name}`,
        `RxNorm could not identify ${med.name} with enough certainty to run medication-specific safety checks. ${med.normalization?.reason ?? ''}`.trim(),
        'RxNorm medication normalization',
        med.normalization?.candidates?.length
          ? `Unresolved candidates: ${med.normalization.candidates.map((candidate) => candidate.name || candidate.rxcui).join('; ')}`
          : 'No clearly corresponding RxNorm candidate was returned.'
      ));
      continue;
    }
    if (!med.label) {
      findings.push(unableFinding(
        med,
        `No FDA label found for ${med.name}`,
        `No matching FDA drug label was found for ${med.name}, so label-based checks (interactions, contraindications, dose limits) could not run for it.`,
        'openFDA drug label lookup'
      ));
      continue;
    }
    const incomplete = checkStatuses.some((result) => ['failed', 'unable_to_check'].includes(result.state));
    if (incomplete) {
      findings.push(unableFinding(
        med,
        `Safety review incomplete for ${med.name}`,
        'One or more relevant safety checks could not be completed. No clean safety conclusion is available for this medication.',
        'MediGuard safety pipeline'
      ));
    } else if (!findings.some((f) => f.affectedMeds?.includes(label))) {
      findings.push({
        category: 'General Safety',
        severity: 'safe',
        title: `No conflicts found for ${med.name}`,
        summary: `No relevant conflict was identified for ${med.name} by the completed checks and sources reviewed (FDA label text, RxClass). This is not a guarantee of safety.`,
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
  const incomplete = checkStatuses.some((result) => ['failed', 'unable_to_check'].includes(result.state))
    || [...newMeds, ...currentMeds].some((med) => med.status !== 'resolved')
    || newMeds.some((med) => !med.label);
  return {
    patient,
    medications: newMeds.map(publicMed),
    findings,
    summary: { high: count('high'), review: count('review'), safe: count('safe') },
    checksPerformed: checkStatuses.filter((result) => result.state === 'passed').length,
    checksAttempted: checkStatuses.length,
    checkStatuses: checkStatuses.map(({ error, findings: checkFindings, ...result }) => ({
      ...result,
      findingCount: checkFindings.length,
    })),
    warnings,
    status: incomplete ? 'safety-review-incomplete' : 'analysis-complete',
  };
}

/** One-shot helper: prescription text in, full analysis out. */
export async function analyzePrescription({ patient = {}, prescription = '', medications }) {
  const meds = Array.isArray(medications) && medications.length > 0
    ? medications
    : (await extractMedications(prescription)).medications;
  return analyzeSafety({ patient, medications: meds });
}
