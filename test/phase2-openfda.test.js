import assert from 'node:assert/strict';
import test from 'node:test';
import { getDrugLabelEvidence } from '../backend/services/openfda.js';
import { analyzeSafety } from '../backend/pipeline/analyzePrescription.js';

function json(body) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function label({
  setId,
  effectiveTime = '20240101',
  generic = 'Phase2drug',
  active = 'PHASE2DRUG',
  form = 'TABLET',
  route = 'ORAL',
  productType = 'HUMAN PRESCRIPTION DRUG',
}) {
  return {
    set_id: setId,
    effective_time: effectiveTime,
    openfda: {
      generic_name: [generic],
      brand_name: [generic],
      substance_name: [generic],
      product_type: [productType],
      route: [route],
    },
    active_ingredient: [active],
    dosage_form: [form],
    route: [route],
  };
}

const unrelated = () => label({ setId: 'unrelated-1', effectiveTime: '20200101', generic: 'Unrelateddrug', active: 'UNRELATEDDRUG' });
const correct = (overrides = {}) => label({ setId: 'correct-1', ...overrides });

function mockOpenFda(results) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('api.fda.gov')) return json({ results });
    throw new Error(`Unexpected URL: ${url}`);
  };
  return () => { globalThis.fetch = originalFetch; };
}

test('the matching label is selected instead of an unrelated first result', async () => {
  const restore = mockOpenFda([unrelated(), correct()]);
  try {
    const result = await getDrugLabelEvidence({ ingredientName: 'Phase2drug', inputName: 'Phase2drug' });
    assert.equal(result.status, 'resolved');
    assert.equal(result.label?.set_id, 'correct-1');
  } finally {
    restore();
  }
});

test('multiple equivalent labels resolve deterministically to the latest record', async () => {
  const restore = mockOpenFda([
    correct({ setId: 'correct-old', effectiveTime: '20220101' }),
    correct({ setId: 'correct-new', effectiveTime: '20240101' }),
  ]);
  try {
    const first = await getDrugLabelEvidence({ ingredientName: 'Phase2drug', inputName: 'Phase2drug' });
    const second = await getDrugLabelEvidence({ ingredientName: 'Phase2drug', inputName: 'Phase2drug' });
    assert.equal(first.status, 'resolved');
    assert.equal(first.label?.set_id, 'correct-new');
    assert.equal(second.label?.set_id, first.label?.set_id);
  } finally {
    restore();
  }
});

test('materially distinct matching labels are ambiguous and select nothing', async () => {
  const restore = mockOpenFda([
    correct({ setId: 'tablet-label', form: 'TABLET' }),
    correct({ setId: 'capsule-label', form: 'CAPSULE' }),
  ]);
  try {
    const result = await getDrugLabelEvidence({ ingredientName: 'Phase2drug', inputName: 'Phase2drug' });
    assert.equal(result.status, 'unavailable');
    assert.equal(result.label, null);
    assert.match(result.reason ?? '', /distinct/i);
  } finally {
    restore();
  }
});

test('no identity-matching label produces an unavailable result', async () => {
  const restore = mockOpenFda([unrelated()]);
  try {
    const result = await getDrugLabelEvidence({ ingredientName: 'Phase2drug', inputName: 'Phase2drug' });
    assert.equal(result.status, 'unavailable');
    assert.equal(result.label, null);
  } finally {
    restore();
  }
});

test('an unavailable FDA label cannot produce a clean safe analysis', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.includes('/rxcui.json')) return json({ idGroup: { rxnormId: ['9001'], name: 'Phase2drug' } });
    if (value.includes('/related.json')) return json({ relatedGroup: { conceptGroup: [] } });
    if (value.includes('/rxclass/')) return json({ rxclassDrugInfoList: { rxclassDrugInfo: [] } });
    if (value.includes('api.fda.gov')) return json({ results: [unrelated()] });
    throw new Error(`Unexpected URL: ${url}`);
  };
  try {
    const result = await analyzeSafety({
      patient: { diagnoses: [{ name: 'hypertension', status: 'active' }] },
      medications: [{ name: 'Phase2drug', dose: '10 mg', frequency: 'daily' }],
    });
    assert.equal(result.status, 'safety-review-incomplete');
    assert.equal(result.findings.some((finding) => finding.severity === 'safe'), false);
    assert.equal(result.findings.some((finding) => /No FDA label found/.test(finding.title)), true);
    assert.equal(
      result.checkStatuses.some((check) => ['failed', 'unable_to_check'].includes(check.state)),
      true
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
