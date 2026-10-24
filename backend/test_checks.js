import assert from 'node:assert';
import { doseToMg, dosesPerDay, findSnippet } from './utils/normalize.js';
import { checkAllergies } from './safety/allergy.js';
import { checkDose } from './safety/doseCheck.js';
import { checkDrugDisease } from './safety/drugDisease.js';
import { checkDuplicateTherapy } from './safety/duplicateTherapy.js';
import { analyzeSafety } from './pipeline/analyzePrescription.js';

console.log('--- RUNNING MEDIGUARD TEST SUITE ---');

// Test 1: Dose parsing
console.log('1. Testing dose parsing...');
assert.strictEqual(doseToMg('1,000 mg'), 1000, '1,000 mg should parse to 1000 mg');
assert.strictEqual(doseToMg('0,5 mg'), 0.5, '0,5 mg should parse to 0.5 mg');
assert.strictEqual(doseToMg('2mg'), 2, '2mg should parse to 2 mg');
assert.strictEqual(doseToMg('500 mcg'), 0.5, '500 mcg should parse to 0.5 mg');
assert.strictEqual(doseToMg('1 g'), 1000, '1 g should parse to 1000 mg');
assert.strictEqual(doseToMg('0 mg'), null, '0 mg should be rejected as null');
assert.strictEqual(doseToMg('-10 mg'), null, '-10 mg should be rejected as null');
assert.strictEqual(doseToMg('invalid'), null, 'invalid dose should be null');

// Test 2: Frequency parsing
console.log('2. Testing frequency parsing...');
assert.strictEqual(dosesPerDay('once weekly'), null, 'once weekly must NOT be counted as once daily');
assert.strictEqual(dosesPerDay('three times weekly'), null, 'three times weekly must NOT be counted as 3 daily');
assert.strictEqual(dosesPerDay('monthly'), null, 'monthly must NOT be counted as daily');
assert.strictEqual(dosesPerDay('PRN'), null, 'PRN must NOT be counted as daily');
assert.strictEqual(dosesPerDay('once daily'), 1, 'once daily should be 1');
assert.strictEqual(dosesPerDay('twice daily'), 2, 'twice daily should be 2');
assert.strictEqual(dosesPerDay('bid'), 2, 'bid should be 2');
assert.strictEqual(dosesPerDay('three times daily'), 3, 'three times daily should be 3');
assert.strictEqual(dosesPerDay('tid'), 3, 'tid should be 3');
assert.strictEqual(dosesPerDay('every 8 hours'), 3, 'every 8 hours should be 3');

// Test 3: Allergy matching (sulfa, sulfite, glimepiride, combo drugs, misspellings)
console.log('3. Testing allergy matching...');

// 3a. Sulfite does NOT match sulfa
async function testSulfite() {
  const patient = {
    allergies: [{ name: 'sulfite', severity: 'moderate', reaction: 'rash' }],
  };
  const newMeds = [
    { name: 'Sulfamethoxazole', ingredientName: 'sulfamethoxazole', classes: [] },
  ];
  const findings = await checkAllergies({ patient, newMeds });
  assert.strictEqual(findings.length, 0, 'Sulfite allergy must NOT match sulfonamide drugs');
}

// 3b. Glimepiride flags precaution against sulfa allergy
async function testGlimepirideSulfa() {
  const patient = {
    allergies: [{ name: 'sulfa', severity: 'severe', reaction: 'anaphylaxis' }],
  };
  const newMeds = [
    { name: 'Glimepiride', ingredientName: 'glimepiride', classes: [{ className: 'Sulfonylureas', classType: 'EPC' }] },
  ];
  const findings = await checkAllergies({ patient, newMeds });
  assert.strictEqual(findings.length, 1, 'Glimepiride should be flagged against sulfa allergy');
  assert.ok(/shares chemical class|sulfonylurea/i.test(findings[0].title + findings[0].summary));
}

// 3c. Augmentin combo drug matches penicillin allergy
async function testAugmentinPenicillin() {
  const patient = {
    allergies: [{ name: 'penicilin', severity: 'severe', reaction: 'hives' }], // misspelling with 1 'l'
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
  assert.strictEqual(findings.length, 1, 'Augmentin must trigger penicillin allergy even with misspelling');
  assert.strictEqual(findings[0].severity, 'high');
}

// 3d. Opioids matching
async function testOpioidAllergy() {
  const patient = {
    allergies: [{ name: 'opioids', severity: 'severe', reaction: 'respiratory arrest' }],
  };
  const newMeds = [
    { name: 'Oxycodone', ingredientName: 'oxycodone', classes: [] },
  ];
  const findings = await checkAllergies({ patient, newMeds });
  assert.strictEqual(findings.length, 1, 'Oxycodone must trigger opioid allergy');
}

// Test 4: Drug-Disease checking (HTN, T2DM, heart failure contraindications)
console.log('4. Testing drug-disease checks...');
async function testDrugDiseaseAcronyms() {
  const patient = {
    diagnoses: [
      { name: 'HTN', status: 'Active' },
      { name: 'T2DM', status: 'Active' },
      { name: 'CHF', status: 'Active' },
    ],
  };

  // Mock label with contraindications and indications
  const betaBlockerMed = {
    name: 'Carvedilol',
    label: {
      indications_and_usage: ['Carvedilol is indicated for the treatment of mild-to-moderate heart failure of ischemic or cardiomyopathic origin.'],
      contraindications: ['Carvedilol is contraindicated in patients with severe sinus bradycardia, second- or third-degree AV block, and decompensated heart failure requiring intravenous inotropic therapy.'],
      warnings: ['In clinical trials of heart failure, worsening heart failure or fluid retention was observed during uptitration.'],
    },
  };

  const findings = await checkDrugDisease({ patient, newMeds: [betaBlockerMed] });
  const hfFinding = findings.find((f) => /heart failure|chf/i.test(f.title + f.summary));
  assert.ok(hfFinding, 'Contraindication in heart failure must NOT be suppressed by indications text');
  assert.strictEqual(hfFinding.severity, 'high', 'Contraindication in heart failure must have high severity');
}

// Test 5: Snippet search prioritizing severe contraindications
console.log('5. Testing snippet severe keyword prioritization...');
function testSevereSnippet() {
  const labelText = 'In a benign pharmacokinetic study of 10 patients, aspirin was administered with no change in clearance. However, concomitant use is contraindicated because life-threatening fatal hemorrhage has been reported when taken together.';
  const snippet = findSnippet(labelText, ['aspirin']);
  assert.ok(snippet.includes('fatal hemorrhage') || snippet.includes('contraindicated'), 'Snippet should prioritize the severe contraindication over the early benign mention');
}

// Test 6: Duplicate therapy with combination drugs
console.log('6. Testing duplicate therapy...');
async function testDuplicateTherapyCombo() {
  const currentMeds = [
    {
      name: 'Tylenol',
      ingredientName: 'acetaminophen',
      ingredients: [{ name: 'acetaminophen', rxCui: '161' }],
      classes: [],
    },
  ];
  const newMeds = [
    {
      name: 'Percocet',
      ingredientName: 'oxycodone',
      ingredients: [
        { name: 'oxycodone', rxCui: '7804' },
        { name: 'acetaminophen', rxCui: '161' },
      ],
      classes: [],
    },
  ];
  const findings = await checkDuplicateTherapy({ newMeds, currentMeds });
  assert.strictEqual(findings.length, 1, 'Percocet and Tylenol must be flagged for duplicate acetaminophen');
  assert.strictEqual(findings[0].severity, 'high');
}

// Test 7: "Safe" must never be the failure state
console.log('7. Testing "Safe" failure state prevention in analyzeSafety...');
async function testSafeFailureState() {
  // 7a. Unrecognized drug without label
  const patient = { currentMeds: [], allergies: [], diagnoses: [] };
  const unrecognizedMed = {
    name: 'XzFakeDrug123',
    dose: '100 mg',
    freq: 'once daily',
  };

  const result = await analyzeSafety({ patient, medications: [unrecognizedMed] });
  const hasSafeCard = result.findings.some((f) => f.severity === 'safe');
  assert.strictEqual(hasSafeCard, false, 'Unrecognized drug must NEVER have a "safe / No conflicts found" card');

  const coverageFinding = result.findings.find((f) => /Could not verify|No FDA label/i.test(f.title));
  assert.ok(coverageFinding, 'Unrecognized drug must have a review finding stating label could not be found');
  assert.strictEqual(coverageFinding.severity, 'review');

  // 7b. Unresolved current medication blocks green "safe" card for new med
  const patientWithUnresolvedCurrent = {
    currentMeds: [{ name: 'UnresolvedCurrentMed999' }],
    allergies: [],
    diagnoses: [],
  };
  const validNewMed = {
    name: 'Ibuprofen',
    dose: '400 mg',
    freq: 'three times daily',
  };

  const resultWithCurrent = await analyzeSafety({ patient: patientWithUnresolvedCurrent, medications: [validNewMed] });
  const safeFindings = resultWithCurrent.findings.filter((f) => f.severity === 'safe');
  assert.strictEqual(safeFindings.length, 0, 'Unresolved current medication must block green "safe" card for new med');
}

async function runAll() {
  await testSulfite();
  await testGlimepirideSulfa();
  await testAugmentinPenicillin();
  await testOpioidAllergy();
  await testDrugDiseaseAcronyms();
  testSevereSnippet();
  await testDuplicateTherapyCombo();
  await testSafeFailureState();
  console.log('>>> ALL MEDIGUARD SAFETY TESTS PASSED SUCCESSFULLY! <<<');
}

runAll().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
