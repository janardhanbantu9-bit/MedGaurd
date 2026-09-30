import { normalizeText, termRegex } from '../utils/normalize.js';

// Terms that indicate a drug belongs to a commonly recorded allergy group.
const ALLERGEN_TERMS = {
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'piperacillin', 'oxacillin', 'nafcillin', 'dicloxacillin'],
  sulfa: ['sulfonamide', 'sulfamethoxazole', 'sulfadiazine', 'sulfasalazine', 'sulfacetamide'],
  cephalosporin: ['cephalosporin', 'cephalexin', 'cefazolin', 'ceftriaxone', 'cefuroxime', 'cefdinir'],
  nsaid: ['nsaid', 'anti-inflammatory', 'ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'meloxicam', 'celecoxib'],
  aspirin: ['aspirin', 'acetylsalicylic'],
};

function allergenKey(name) {
  const n = normalizeText(name).replace(/\b(drugs?|allergy|antibiotics?)\b/g, '').trim();
  if (n.includes('sulf')) return 'sulfa';
  if (n.includes('penicillin')) return 'penicillin';
  if (n.includes('cephalosporin')) return 'cephalosporin';
  if (n.includes('nsaid') || n.includes('anti-inflammatory')) return 'nsaid';
  if (n.includes('aspirin')) return 'aspirin';
  return n;
}

export async function checkAllergies({ patient, newMeds }) {
  const findings = [];

  for (const allergy of patient?.allergies ?? []) {
    const key = allergenKey(allergy.name);
    if (!key) continue;
    const terms = ALLERGEN_TERMS[key] ?? [key];

    for (const med of newMeds) {
      const names = [med.name, med.ingredientName].filter(Boolean).join(' ');
      const classNames = (med.classes ?? []).map((c) => c.className).join(' | ');

      const nameHit = terms.find((t) => termRegex(t).test(names));
      const classHit = nameHit ? null : terms.find((t) => termRegex(t).test(classNames));
      if (!nameHit && !classHit) continue;

      const detail = [allergy.severity, allergy.reaction].filter(Boolean).join(' – ');
      findings.push({
        category: 'Allergy Conflict',
        severity: nameHit ? 'high' : 'review',
        title: `${med.name} may conflict with recorded ${allergy.name} allergy`,
        summary: nameHit
          ? `${med.name} matches the patient's recorded ${allergy.name} allergy${detail ? ` (${detail})` : ''}.`
          : `${med.name} belongs to a drug class associated with the patient's recorded ${allergy.name} allergy${detail ? ` (${detail})` : ''}. Cross-reactivity is possible.`,
        affectedMeds: [`${med.name} (New)`],
        patientContext: [`${allergy.name} allergy${detail ? ` (${detail})` : ''}`],
        evidenceSource: nameHit ? 'Patient allergy record; RxNorm drug name' : 'Patient allergy record; RxClass drug classification',
        evidence: [
          { source: 'Patient allergy record', snippet: `${allergy.name}${detail ? `: ${detail}` : ''}` },
          ...(classHit ? [{ source: 'RxClass', snippet: classNames }] : []),
        ],
        action: 'Confirm allergy history with the patient and prescriber before dispensing.',
      });
    }
  }
  return findings;
}
