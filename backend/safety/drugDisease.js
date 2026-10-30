import { findSnippet, hasNegatedSafetyLanguage, sectionText, termRegex } from '../utils/normalize.js';

// Medical abbreviations and clinical conditions mapped to terms used in FDA drug labels
const DIAGNOSIS_TERMS = [
  [/\b(htn|hypertension|high blood pressure|blood pressure)\b/i, ['hypertension', 'blood pressure']],
  [/\b(t2dm|t1dm|dm2|dm1|dm|diabetes|diabetic)\b/i, ['diabetes', 'diabetic', 'hypoglycemia', 'hyperglycemia']],
  [/\b(afib|a-fib|atrial fibrillation|arrhythmia)\b/i, ['atrial fibrillation', 'arrhythmia', 'qt prolongation']],
  [/\b(chf|heart failure|cardiac failure)\b/i, ['heart failure', 'cardiac failure', 'cardiogenic shock']],
  [/\b(ckd|esrd|kidney|renal|nephropathy)\b/i, ['renal impairment', 'kidney disease', 'renal failure', 'renal']],
  [/\b(liver|hepat|cirrhosis|hepatic)\b/i, ['hepatic impairment', 'liver disease', 'hepatic failure', 'hepatic']],
  [/\b(asthma|reactive airway)\b/i, ['asthma', 'bronchospasm']],
  [/\b(copd|emphysema|chronic bronchitis)\b/i, ['chronic obstructive pulmonary disease', 'copd', 'bronchospasm']],
  [/\b(ulcer|gerd|gastro|peptic)\b/i, ['peptic ulcer', 'gastrointestinal bleeding', 'gerd']],
  [/\b(cad|coronary|myocardial|angina|mi)\b/i, ['coronary artery disease', 'myocardial infarction', 'angina']],
  [/\b(bph|prostate|prostatic)\b/i, ['benign prostatic hyperplasia', 'prostatic']],
  [/\b(depress|mdd)\b/i, ['depression', 'major depressive disorder', 'suicid']],
  [/\b(seizure|epilep)\b/i, ['seizure', 'epilepsy']],
];

function termsFor(name) {
  const trimmed = String(name || '').trim();
  const match = DIAGNOSIS_TERMS.find(([re]) => re.test(trimmed));
  if (match) return match[1];

  const cleaned = trimmed.toLowerCase()
    .replace(/\b(type\s*\d|mellitus|chronic|acute|history of|disorder)\b/g, '')
    .trim();
  return cleaned ? [cleaned] : [];
}

export async function checkDrugDisease({ patient, newMeds = [] }) {
  const findings = [];
  if (!newMeds?.length) return { findings, state: 'not_applicable' };
  const diagnoses = (patient?.diagnoses ?? []).filter((d) => !d.status || /active/i.test(d.status));
  if (diagnoses.length === 0) return { findings, state: 'passed' };

  // Label text is the evidence source. A missing label means disease conflicts
  // for that medication could not be checked.
  let state = newMeds.some((med) => !med?.label) ? 'unable_to_check' : 'passed';

  for (const med of newMeds) {
    if (!med.label) continue;

    const contraindications = sectionText(med.label, 'contraindications');
    const boxedWarnings = sectionText(med.label, 'boxed_warning');
    const warnings = sectionText(med.label, 'warnings', 'warnings_and_cautions', 'precautions');
    const indications = sectionText(med.label, 'indications_and_usage');

    for (const dx of diagnoses) {
      const terms = termsFor(dx.name);
      if (terms.length === 0) continue;

      // 1. Strict contraindications and boxed warnings are NEVER skipped,
      // even if the drug is indicated for another stage of the condition
      // (e.g. beta-blockers in acute decompensated heart failure).
      const contra = findSnippet(contraindications, terms);
<<<<<<< HEAD
      const boxed = contra ? null : findSnippet(boxedWarnings, terms);

      if (contra || boxed) {
        findings.push({
          category: 'Drug–Disease Conflict',
          severity: 'high',
          title: `Contraindication: ${med.name} with ${dx.name}`,
          summary: `The FDA label lists a contraindication or boxed warning mentioning ${dx.name}, an active condition for this patient.`,
          affectedMeds: [`${med.name} (New)`],
          patientContext: [`${dx.name} (Active Diagnosis)`],
          evidenceSource: `openFDA drug label – ${contra ? 'Contraindications' : 'Boxed Warning'} section`,
          evidence: [{ source: `${med.name} FDA label`, snippet: contra ?? boxed }],
          action: 'Clinician review required before dispensing; potential contraindication.',
        });
        continue;
      }

      // 2. Warnings and precautions check
      const warn = findSnippet(warnings, terms);
      if (warn) {
        // If the condition is also a primary indication, check if the warning is a caution or secondary risk
        const isIndicated = terms.some((t) => termRegex(t).test(indications));
        findings.push({
          category: 'Drug–Disease Conflict',
          severity: 'review',
          title: `Precaution: ${med.name} and ${dx.name}`,
          summary: isIndicated
            ? `The FDA label notes special precautions or monitoring recommendations for ${dx.name}.`
            : `The FDA label carries a warning mentioning ${dx.name}, which is recorded in the patient profile.`,
          affectedMeds: [`${med.name} (New)`],
          patientContext: [`${dx.name} (Active Diagnosis)`],
          evidenceSource: 'openFDA drug label – Warnings & Precautions section',
          evidence: [{ source: `${med.name} FDA label`, snippet: warn }],
          action: 'Review label monitoring recommendations for this condition.',
        });
      }
=======
      const warn = contra ? null : findSnippet(warnings, terms);
      if (!contra && !warn) continue;
      const definiteContraindication = Boolean(contra) && !hasNegatedSafetyLanguage(contra);

      findings.push({
        category: 'Drug–Disease Conflict',
        severity: definiteContraindication ? 'high' : 'review',
        title: `${med.name} and ${dx.name}`,
        summary: definiteContraindication
          ? `The FDA label lists a contraindication that mentions ${dx.name}, which is an active diagnosis for this patient.`
          : contra
            ? `The FDA contraindications text mentions ${dx.name}, but its wording is negated or otherwise not a definite contraindication. Review the cited text.`
          : `The FDA label carries a warning that mentions ${dx.name}, which is an active diagnosis for this patient.`,
        affectedMeds: [`${med.name} (New)`],
        patientContext: [`${dx.name} (Active Diagnosis)`],
        evidenceSource: `openFDA drug label – ${contra ? 'Contraindications' : 'Warnings'} section`,
        evidence: [{ source: `${med.name} FDA label (${contra ? 'Contraindications' : 'Warnings'})`, snippet: contra ?? warn }],
        action: definiteContraindication ? 'Clinician review required before dispensing.' : 'Review the label wording and monitor as appropriate.',
      });
>>>>>>> main
    }
  }
  return { findings, state };
}
