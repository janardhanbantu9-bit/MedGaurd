import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDrug } from '../backend/services/rxnorm.js';
import { analyzeSafety } from '../backend/pipeline/analyzePrescription.js';
import { checkDose } from '../backend/safety/doseCheck.js';
import { checkDrugDisease } from '../backend/safety/drugDisease.js';
import { checkDrugDrug } from '../backend/safety/drugDrug.js';
import { dosesPerDay } from '../backend/utils/normalize.js';

function json(body) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

test('an ambiguous RxNorm approximate candidate remains unresolved', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/rxcui.json')) return json({ idGroup: {} });
    if (String(url).includes('/approximateTerm.json')) {
      return json({ approximateGroup: { candidate: [{ rxcui: '123', name: 'unrelated drug', score: '100', rank: '1' }] } });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
  try {
    const result = await normalizeDrug('medicine name that was not found');
    assert.equal(result.status, 'unresolved');
    assert.equal(result.rxCui, null);
    assert.match(result.normalization.reason, /clearly matches/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a failed check makes the final analysis incomplete and never safe', async () => {
  const originalFetch = globalThis.fetch;
  const label = {
    set_id: 'testdrug-label-1',
    effective_time: '20240101',
    dosage_and_administration: ['No maximum is specified.'],
    openfda: {
      generic_name: ['testdrug'],
      brand_name: ['testdrug'],
      substance_name: ['testdrug'],
      product_type: ['HUMAN PRESCRIPTION DRUG'],
      route: ['ORAL'],
    },
    active_ingredient: ['TESTDRUG'],
    dosage_form: ['TABLET'],
    route: ['ORAL'],
  };
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.includes('/rxcui.json')) return json({ idGroup: { rxnormId: ['1'], name: 'testdrug' } });
    if (value.includes('/related.json')) return json({ relatedGroup: { conceptGroup: [] } });
    if (value.includes('/rxclass/')) return json({ rxclassDrugInfoList: { rxclassDrugInfo: [] } });
    if (value.includes('api.fda.gov')) return json({ results: [label] });
    throw new Error(`Unexpected URL: ${url}`);
  };
  try {
    const result = await analyzeSafety({
      patient: {},
      medications: [{ name: 'testdrug', dose: '10 mg', frequency: 'daily' }],
      checks: [async function unavailableCheck() { throw new Error('source unavailable'); }],
    });
    assert.equal(result.status, 'safety-review-incomplete');
    assert.equal(result.checkStatuses[0].state, 'failed');
    assert.equal(result.findings.some((finding) => finding.severity === 'safe'), false);
    assert.equal(result.findings.some((finding) => /Safety review incomplete/.test(finding.title)), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('unparseable frequency is explicitly unable to check', async () => {
  const result = await checkDose({ newMeds: [{ name: 'testdrug', dose: '10 mg', frequency: 'whenever needed', label: {} }] });
  assert.equal(result.state, 'unable_to_check');
  assert.match(result.findings[0].title, /Unable to check dose/);
});

test('common frequency instructions are parsed without guessing', () => {
  assert.equal(dosesPerDay('1 tablet once a day'), 1);
  assert.equal(dosesPerDay('twice daily'), 2);
  assert.equal(dosesPerDay('twice a day'), 2);
  assert.equal(dosesPerDay('2 times daily'), 2);
  assert.equal(dosesPerDay('q8h'), 3);
  assert.equal(dosesPerDay('every 12 hours'), 2);
  assert.equal(dosesPerDay('as directed'), null);
});

test('negated contraindication language is review, not high severity', async () => {
  const med = { name: 'testdrug', label: { contraindications: ['Testdrug is not contraindicated in renal impairment.'] } };
  const disease = await checkDrugDisease({ patient: { diagnoses: [{ name: 'chronic kidney disease', status: 'active' }] }, newMeds: [med] });
  assert.equal(disease.findings[0].severity, 'review');

  const interaction = await checkDrugDrug({
    newMeds: [{ ...med, label: { drug_interactions: ['Testdrug is not contraindicated with otherdrug.'] } }, { name: 'otherdrug', label: { drug_interactions: ['No interaction text.'] } }],
    currentMeds: [],
  });
  assert.equal(interaction.findings[0].severity, 'review');
});
