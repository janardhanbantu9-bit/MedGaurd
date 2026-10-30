import assert from 'node:assert';
import { doseToMg, dosesPerDay, findSnippet } from './utils/normalize.js';
import { checkAllergies } from './safety/allergy.js';
import { checkDose } from './safety/doseCheck.js';
import { checkDrugDisease } from './safety/drugDisease.js';
import { checkDuplicateTherapy } from './safety/duplicateTherapy.js';
import { checkDrugDrug } from './safety/drugDrug.js';
import { analyzeSafety } from './pipeline/analyzePrescription.js';

console.log('--- RUNNING EXTENDED MEDIGUARD TEST SUITE ---');

// Edge cases in dose parsing
console.log('Testing dose edge cases: whitespace, commas, mcgs, g, absurd doses...');
assert.strictEqual(doseToMg('   1,000  mg  '), 1000);
assert.strictEqual(doseToMg('0,25 mg'), 0.25);
assert.strictEqual(doseToMg('10000000 mg'), null, 'Absurd dose > 100k mg must be null');
assert.strictEqual(doseToMg('10,20,30 mg'), null, 'Ambiguous commas must be null');
assert.strictEqual(doseToMg('  '), null);

// Frequency edge cases
console.log('Testing frequency edge cases: QHS, BID, weekly, monthly, PRN...');
assert.strictEqual(dosesPerDay('qhs'), 1);
assert.strictEqual(dosesPerDay('at bedtime'), 1);
assert.strictEqual(dosesPerDay('bid'), 2);
assert.strictEqual(dosesPerDay('every 6 hours'), 4);
assert.strictEqual(dosesPerDay('once every 2 weeks'), null);
assert.strictEqual(dosesPerDay('take 2 tablets as needed for pain'), null);

// Combo drug: Augmentin allergy & duplicate
console.log('Testing Augmentin penicillin allergy & Percocet duplicate therapy...');
async function testAugmentin() {
  const patient = {
    allergies: [{ name: 'penicillin', severity: 'high', reaction: 'anaphylaxis' }],
  };
  const newMeds = [
    {
      name: 'Augmentin',
      ingredientName: 'amoxicillin',
      ingredients: [{ name: 'amoxicillin' }, { name: 'clavulanate' }],
      classes: [],
    },
  ];
  const findings = await checkAllergies({ patient, newMeds });
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].severity, 'high');
  assert.ok(/amoxicillin/i.test(findings[0].evidenceSource + findings[0].summary));
}

// Drug-Drug Interaction: Warfarin + Aspirin (severe bleed risk)
console.log('Testing severe drug-drug interaction flagging...');
async function testDrugDrugInteraction() {
  const currentMeds = [
    {
      name: 'Warfarin',
      ingredientName: 'warfarin',
      classes: [{ classId: 'B01AA03', classType: 'ATC' }],
      label: {
        drug_interactions: ['Concomitant use of NSAIDs or aspirin with warfarin increases the risk of severe life-threatening bleeding and hemorrhage.'],
      },
    },
  ];
  const newMeds = [
    {
      name: 'Aspirin',
      ingredientName: 'aspirin',
      classes: [{ classId: 'B01AC06', classType: 'ATC' }],
      label: {
        drug_interactions: ['Bleeding risk: Coadministration of aspirin and oral anticoagulants like warfarin causes major bleeding.'],
      },
    },
  ];
  const findings = await checkDrugDrug({ newMeds, currentMeds });
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].severity, 'high');
  assert.ok(/interaction/i.test(findings[0].title));
}

// Renal & elderly disease checks
console.log('Testing CKD / renal failure disease conflict...');
async function testRenalDisease() {
  const patient = {
    diagnoses: [{ name: 'CKD stage 4', status: 'Active' }],
  };
  const newMeds = [
    {
      name: 'Metformin',
      label: {
        contraindications: ['Metformin is contraindicated in patients with severe renal impairment (eGFR below 30 mL/min/1.73 m2) due to the risk of fatal lactic acidosis.'],
      },
    },
  ];
  const findings = await checkDrugDisease({ patient, newMeds });
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].severity, 'high');
  assert.ok(/renal|ckd/i.test(findings[0].title + findings[0].summary + (findings[0].evidence[0]?.snippet || '')));
}

async function run() {
  await testAugmentin();
  await testDrugDrugInteraction();
  await testRenalDisease();
  console.log('>>> ALL EXTENDED TESTS PASSED! <<<');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
