import { findSnippet, sectionText, termRegex } from '../utils/normalize.js';

// Diagnosis -> words a label would use. Falls back to the diagnosis name itself.
const DIAGNOSIS_TERMS = [
  [/hypertension|blood pressure/i, ['hypertension']],
  [/diabet/i, ['diabetes']],
  [/atrial fibrillation|arrhythmia/i, ['atrial fibrillation', 'arrhythmia']],
  [/heart failure|chf/i, ['heart failure']],
  [/kidney|renal|ckd/i, ['renal impairment', 'kidney disease', 'renal failure']],
  [/liver|hepat|cirrhosis/i, ['hepatic impairment', 'liver disease', 'hepatic failure']],
  [/asthma/i, ['asthma']],
  [/ulcer|gerd|gastro/i, ['peptic ulcer', 'gastrointestinal bleeding']],
  [/depress/i, ['depression']],
  [/seizure|epilep/i, ['seizure', 'epilepsy']],
];

function termsFor(name) {
  const match = DIAGNOSIS_TERMS.find(([re]) => re.test(name));
  if (match) return match[1];
  const cleaned = name.toLowerCase().replace(/\b(type\s*\d|mellitus|chronic|acute|history of)\b/g, '').trim();
  return cleaned ? [cleaned] : [];
}

export async function checkDrugDisease({ patient, newMeds }) {
  const findings = [];
  const diagnoses = (patient?.diagnoses ?? []).filter((d) => !d.status || /active/i.test(d.status));

  for (const med of newMeds) {
    if (!med.label) continue;
    const contraindications = sectionText(med.label, 'contraindications');
    const warnings = sectionText(med.label, 'boxed_warning', 'warnings', 'warnings_and_cautions', 'precautions');
    const indications = sectionText(med.label, 'indications_and_usage');

    for (const dx of diagnoses) {
      const terms = termsFor(dx.name);
      if (terms.length === 0) continue;
      // If the drug is indicated for the condition, a mention in the label is not a conflict.
      if (terms.some((t) => termRegex(t).test(indications))) continue;

      const contra = findSnippet(contraindications, terms);
      const warn = contra ? null : findSnippet(warnings, terms);
      if (!contra && !warn) continue;

      findings.push({
        category: 'Drug–Disease Conflict',
        severity: contra ? 'high' : 'review',
        title: `${med.name} and ${dx.name}`,
        summary: contra
          ? `The FDA label lists a contraindication that mentions ${dx.name}, which is an active diagnosis for this patient.`
          : `The FDA label carries a warning that mentions ${dx.name}, which is an active diagnosis for this patient.`,
        affectedMeds: [`${med.name} (New)`],
        patientContext: [`${dx.name} (Active Diagnosis)`],
        evidenceSource: `openFDA drug label – ${contra ? 'Contraindications' : 'Warnings'} section`,
        evidence: [{ source: `${med.name} FDA label (${contra ? 'Contraindications' : 'Warnings'})`, snippet: contra ?? warn }],
        action: contra ? 'Clinician review required before dispensing.' : 'Review the label warning and monitor as appropriate.',
      });
    }
  }
  return findings;
}
