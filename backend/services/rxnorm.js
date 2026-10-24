const BASE = 'https://rxnav.nlm.nih.gov/REST';

// Curated dictionary of common high-risk combination medications to guarantee
// complete ingredient resolution even under RxNav network latency or downtime.
const KNOWN_COMBINATIONS = {
  augmentin: [
    { name: 'amoxicillin', rxCui: '723' },
    { name: 'clavulanate', rxCui: '2582' },
  ],
  percocet: [
    { name: 'oxycodone', rxCui: '7804' },
    { name: 'acetaminophen', rxCui: '161' },
  ],
  vicodin: [
    { name: 'hydrocodone', rxCui: '5489' },
    { name: 'acetaminophen', rxCui: '161' },
  ],
  norco: [
    { name: 'hydrocodone', rxCui: '5489' },
    { name: 'acetaminophen', rxCui: '161' },
  ],
  bactrim: [
    { name: 'sulfamethoxazole', rxCui: '10217' },
    { name: 'trimethoprim', rxCui: '10829' },
  ],
  septra: [
    { name: 'sulfamethoxazole', rxCui: '10217' },
    { name: 'trimethoprim', rxCui: '10829' },
  ],
  cotrimoxazole: [
    { name: 'sulfamethoxazole', rxCui: '10217' },
    { name: 'trimethoprim', rxCui: '10829' },
  ],
  tylenol3: [
    { name: 'codeine', rxCui: '2670' },
    { name: 'acetaminophen', rxCui: '161' },
  ],
  'tylenol #3': [
    { name: 'codeine', rxCui: '2670' },
    { name: 'acetaminophen', rxCui: '161' },
  ],
};

async function getJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`RxNorm request failed: ${response.status}`);
  return response.json();
}

export async function normalizeDrug(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Drug name is required');

  const lower = trimmed.toLowerCase();
  const knownCombo = KNOWN_COMBINATIONS[lower];

  let rxCui = null;
  try {
    const exact = await getJson(`${BASE}/rxcui.json?name=${encodeURIComponent(trimmed)}&search=2`);
    rxCui = exact?.idGroup?.rxnormId?.[0] ?? null;

    if (!rxCui) {
      const approx = await getJson(`${BASE}/approximateTerm.json?term=${encodeURIComponent(trimmed)}&maxEntries=1`);
      rxCui = approx?.approximateGroup?.candidate?.[0]?.rxcui ?? null;
    }
  } catch (error) {
    // If exact/approx lookup fails but knownCombo exists, we still have reliable data
    if (!knownCombo) throw error;
  }

  let ingredients = [];

  if (rxCui) {
    try {
      const related = await getJson(`${BASE}/rxcui/${rxCui}/related.json?tty=IN`);
      const concepts = related?.relatedGroup?.conceptGroup
        ?.flatMap((group) => group.conceptProperties ?? []) ?? [];

      ingredients = concepts.map((c) => ({
        rxCui: c.rxcui,
        name: c.name,
      }));
    } catch {
      /* ingredient lookup is best-effort */
    }
  }

  if (knownCombo) {
    for (const item of knownCombo) {
      if (!ingredients.some((ing) => ing.name.toLowerCase() === item.name.toLowerCase())) {
        ingredients.push(item);
      }
    }
  }

  if (ingredients.length === 0) {
    ingredients = [{ rxCui, name: trimmed }];
  }

  const primaryIngredient = ingredients[0] || { rxCui, name: trimmed };

  return {
    input: trimmed,
    rxCui,
    ingredientRxCui: primaryIngredient.rxCui ?? rxCui,
    ingredientName: primaryIngredient.name ?? trimmed,
    ingredients,
  };
}
