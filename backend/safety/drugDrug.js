import { findSnippet, sectionText, termRegex } from '../utils/normalize.js';

// Class-level wording that labels use ("NSAIDs", "anticoagulants") keyed by ATC prefix
const CLASS_TERMS = [
  ['M01A', ['NSAID', 'nonsteroidal anti-inflammatory', 'ibuprofen', 'naproxen']],
  ['B01A', ['anticoagulant', 'antiplatelet', 'warfarin', 'heparin', 'direct oral anticoagulant', 'doac', 'aspirin']],
  ['C09A', ['ACE inhibitor', 'angiotensin converting enzyme']],
  ['C09C', ['angiotensin receptor blocker', 'angiotensin II receptor', 'arb']],
  ['C03', ['diuretic', 'thiazide', 'loop diuretic', 'potassium-sparing']],
  ['C10A', ['statin', 'HMG-CoA', 'atorvastatin', 'simvastatin']],
  ['N06A', ['antidepressant', 'SSRI', 'SNRI', 'serotonin']],
  ['A10', ['antidiabetic', 'hypoglycemic', 'sulfonylurea', 'metformin', 'insulin']],
  ['N02A', ['opioid', 'opiate', 'narcotic', 'sedative', 'respiratory depression']],
  ['N05B', ['benzodiazepine', 'anxiolytic', 'cns depressant']],
];

const SEVERE = /contraindicat|avoid|serious|fatal|life-threatening|severe|major|bleed|hemorrhag|not recommended|toxicity|respiratory depression/i;

function classTerms(med) {
  const atc = (med.classes ?? []).filter((c) => c.classType?.startsWith('ATC')).map((c) => c.classId);
  return CLASS_TERMS.filter(([prefix]) => atc.some((id) => id.startsWith(prefix))).flatMap(([, terms]) => terms);
}

/** Does `source`'s label mention `target` (by name/ingredient) or its drug class? */
function labelMentions(source, target) {
  const text = sectionText(source.label, 'drug_interactions', 'contraindications', 'boxed_warning');
  if (!text) return null;

  const targetIngredients = (target.ingredients ?? []).map((ing) => ing.name).filter(Boolean);
  const nameTerms = [target.name, target.ingredientName, ...targetIngredients].filter(Boolean);

  const byName = findSnippet(text, nameTerms);
  if (byName) return { snippet: byName, level: 'drug' };

  const byClass = findSnippet(text, classTerms(target));
  if (byClass) return { snippet: byClass, level: 'class' };
  return null;
}

export async function checkDrugDrug({ newMeds, currentMeds }) {
  const findings = [];

  newMeds.forEach((med, i) => {
    const others = [
      ...currentMeds.map((m) => ({ med: m, tag: 'Current' })),
      ...newMeds.slice(i + 1).map((m) => ({ med: m, tag: 'New' })),
    ];

    for (const { med: other, tag } of others) {
      const medHasLabel = Boolean(med.label);
      const otherHasLabel = Boolean(other.label);

      // If neither drug has an FDA label with an interaction section
      const medSection = sectionText(med.label, 'drug_interactions', 'contraindications', 'boxed_warning');
      const otherSection = sectionText(other.label, 'drug_interactions', 'contraindications', 'boxed_warning');

      if (!medSection && !otherSection) {
        // Handled as data coverage / verification note if neither label contains an interaction section
        continue;
      }

      const hits = [
        { from: med, to: other, hit: labelMentions(med, other) },
        { from: other, to: med, hit: labelMentions(other, med) },
      ].filter((h) => h.hit);

      if (hits.length === 0) continue;

      const severe = hits.some((h) => SEVERE.test(h.hit.snippet));
      const classOnly = hits.every((h) => h.hit.level === 'class');

      findings.push({
        category: 'Drug–Drug Interaction',
        severity: severe ? 'high' : 'review',
        title: `${severe ? 'Significant interaction' : 'Possible interaction'}: ${med.name} + ${other.name}`,
        summary: `The FDA label for ${hits[0].from.name} discusses an interaction with ${classOnly ? 'the drug class of ' : ''}${hits[0].to.name}. Review the label excerpt below.`,
        affectedMeds: [`${med.name} (New)`, `${other.name} (${tag})`],
        evidenceSource: 'openFDA drug label – Drug Interactions / Contraindications sections',
        evidence: hits.map((h) => ({
          source: `${h.from.name} FDA label${h.hit.level === 'class' ? ' (class-level mention)' : ''}`,
          snippet: h.hit.snippet,
        })),
        action: severe
          ? 'Clinician review highly recommended prior to dispensing; potential significant interaction.'
          : 'Review the label guidance and monitor for interaction effects as appropriate.',
      });
    }
  });

  return findings;
}
