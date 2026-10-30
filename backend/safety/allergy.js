import { normalizeText, termRegex } from '../utils/normalize.js';

// Comprehensive dictionary of allergen classes and representative medications.
// Includes known cross-reactive drug classes (e.g. sulfonylureas & thiazides for sulfa allergy).
const ALLERGEN_TERMS = {
  penicillin: [
    'penicillin', 'penicilin', 'penecillin', 'amoxicillin', 'amoxacillin', 'amoxycillin',
    'ampicillin', 'piperacillin', 'oxacillin', 'nafcillin', 'dicloxacillin', 'augmentin',
    'beta-lactam',
  ],
  sulfa: [
    'sulfa', 'sulfonamide', 'sulfamethoxazole', 'sulfadiazine', 'sulfasalazine', 'sulfacetamide',
    'sulfisoxazole', 'bactrim', 'septra',
    // Sulfonylureas (cross-reactivity precautions with sulfa moiety)
    'glimepiride', 'glipizide', 'glyburide', 'gliclazide', 'tolbutamide', 'sulfonylurea',
    // Thiazides (contain sulfonamide group)
    'hydrochlorothiazide', 'hctz', 'chlorthalidone', 'indapamide', 'metolazone', 'thiazide',
  ],
  cephalosporin: [
    'cephalosporin', 'cephalexin', 'cefazolin', 'ceftriaxone', 'cefuroxime', 'cefdinir',
    'cefepime', 'cefaclor', 'keflex',
  ],
  nsaid: [
    'nsaid', 'anti-inflammatory', 'ibuprofen', 'ibuprophen', 'advil', 'motrin',
    'naproxen', 'aleve', 'diclofenac', 'ketorolac', 'meloxicam', 'celecoxib',
    'indomethacin', 'piroxicam', 'etodolac',
  ],
  aspirin: ['aspirin', 'acetylsalicylic', 'asa', 'bayer'],
  opioid: [
    'opioid', 'opiate', 'codeine', 'morphine', 'oxycodone', 'hydrocodone', 'hydromorphone',
    'fentanyl', 'tramadol', 'methadone', 'buprenorphine', 'percocet', 'vicodin', 'norco', 'dilaudid',
  ],
  statin: [
    'statin', 'atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin',
    'lipitor', 'crestor', 'zocor',
  ],
  ace_inhibitor: [
    'ace inhibitor', 'lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril', 'prinivil', 'zestril',
  ],
};

function allergenKey(name) {
  const n = normalizeText(name).replace(/\b(drugs?|allergy|antibiotics?)\b/g, '').trim();

  // Sulfite is a food/preservative allergy and must NOT match sulfonamide (sulfa) drugs
  if (/\bsulfites?\b|\bsulphites?\b/i.test(n)) {
    return 'sulfite';
  }

  if (n.includes('sulfa') || n.includes('sulfonamide')) return 'sulfa';
  if (n.includes('penicillin') || n.includes('penicilin')) return 'penicillin';
  if (n.includes('cephalosporin')) return 'cephalosporin';
  if (n.includes('nsaid') || n.includes('anti-inflammatory')) return 'nsaid';
  if (n.includes('aspirin') || n.includes('acetylsalicylic')) return 'aspirin';
  if (n.includes('opioid') || n.includes('opiate')) return 'opioid';
  if (n.includes('statin')) return 'statin';
  if (n.includes('ace inhibitor')) return 'ace_inhibitor';
  return n;
}

export async function checkAllergies({ patient, newMeds }) {
  const findings = [];

  for (const allergy of patient?.allergies ?? []) {
    const key = allergenKey(allergy.name);
    if (!key) continue;

    // Sulfite allergy does not conflict with sulfonamide pharmaceuticals
    if (key === 'sulfite') continue;

    const terms = ALLERGEN_TERMS[key] ?? [key];

    for (const med of newMeds) {
      // Gather all drug name variations and all active ingredients (e.g. Augmentin -> Amoxicillin)
      const ingredientNames = (med.ingredients ?? []).map((ing) => ing.name).filter(Boolean);
      const namesList = [med.name, med.ingredientName, ...ingredientNames].filter(Boolean);
      const namesText = namesList.join(' ');
      const classNames = (med.classes ?? []).map((c) => c.className).join(' | ');

      const nameHit = terms.find((t) => termRegex(t).test(namesText));
      const classHit = nameHit ? null : terms.find((t) => termRegex(t).test(classNames));
      if (!nameHit && !classHit) continue;

      const isDirectMatch = Boolean(nameHit);
      const isSulfaCrossReactive =
        key === 'sulfa' &&
        (/glimepiride|glipizide|glyburide|gliclazide|tolbutamide|hydrochlorothiazide|hctz|chlorthalidone|indapamide|thiazide|sulfonylurea/i.test(namesText) ||
          /sulfonylurea|thiazide/i.test(classNames));

      const detail = [allergy.severity, allergy.reaction].filter(Boolean).join(' – ');
      const severity = isSulfaCrossReactive ? 'review' : (isDirectMatch ? 'high' : 'review');

      const matchedIngredient = (med.ingredients ?? []).find((ing) => terms.some((t) => termRegex(t).test(ing.name)));
      let title = `${med.name} may conflict with recorded ${allergy.name} allergy`;
      let summary = `${med.name}${matchedIngredient && matchedIngredient.name.toLowerCase() !== med.name.toLowerCase() ? ` (contains active ingredient ${matchedIngredient.name})` : ''} matches the patient's recorded ${allergy.name} allergy${detail ? ` (${detail})` : ''}.`;

      if (isSulfaCrossReactive) {
        title = `${med.name} shares chemical class with recorded ${allergy.name} allergy`;
        summary = `${med.name} is a sulfonamide-derived drug (sulfonylurea/thiazide). While antimicrobial sulfa cross-reactivity is distinct, clinical caution and allergy verification are recommended${detail ? ` (${detail})` : ''}.`;
      } else if (!isDirectMatch && classHit) {
        summary = `${med.name} belongs to a drug class associated with the patient's recorded ${allergy.name} allergy${detail ? ` (${detail})` : ''}. Cross-reactivity is possible.`;
      }

      findings.push({
        category: 'Allergy Conflict',
        severity,
        title,
        summary,
        affectedMeds: [`${med.name} (New)`],
        patientContext: [`${allergy.name} allergy${detail ? ` (${detail})` : ''}`],
        evidenceSource: isDirectMatch
          ? 'Patient allergy record; RxNorm active ingredient'
          : 'Patient allergy record; RxClass drug classification',
        evidence: [
          { source: 'Patient allergy record', snippet: `${allergy.name}${detail ? `: ${detail}` : ''}` },
          ...(classHit ? [{ source: 'RxClass', snippet: classNames }] : []),
        ],
        action: severity === 'high'
          ? 'Do not dispense without consulting the prescriber; verify allergy reaction severity.'
          : 'Confirm allergy history and previous tolerance with the patient and prescriber.',
      });
    }
  }
  return findings;
}
