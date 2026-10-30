const BASE = 'https://rxnav.nlm.nih.gov/REST';

<<<<<<< HEAD
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
=======
function comparableName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[®™]/g, '')
    // Strength and common dosage-form words do not identify a different active drug.
    .replace(/\b\d+(?:\.\d+)?\s*(?:mcg|μg|ug|mg|g|ml|%|units?)\b/g, ' ')
    .replace(/\b(?:oral|topical|ophthalmic|otic|nasal|inhalation|extended|delayed|immediate|release|tablet|tablets|capsule|capsules|solution|suspension|cream|ointment|patch|injection|injectable)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unresolved(input, reason, candidates = []) {
  return {
    input,
    status: 'unresolved',
    rxCui: null,
    ingredientRxCui: null,
    ingredientName: null,
    normalization: {
      status: 'unresolved',
      reason,
      candidates: candidates.map(({ rxcui, name, score, rank, source }) => ({ rxcui, name, score, rank, source })),
    },
  };
}
>>>>>>> main

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

<<<<<<< HEAD
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
=======
  let rxCui = null;
  let normalization = null;
  const exact = await getJson(`${BASE}/rxcui.json?name=${encodeURIComponent(trimmed)}&search=2`);
  rxCui = exact?.idGroup?.rxnormId?.[0] ?? null;
  if (rxCui) {
    normalization = {
      status: 'resolved',
      method: 'exact',
      queriedName: trimmed,
      returnedName: exact?.idGroup?.name ?? null,
    };
  }

  if (!rxCui) {
    // ApproximateTerm exposes candidate names, scores, ranks and sources.  Do not
    // treat its ordering/score as proof of identity: accept only an unambiguous
    // candidate whose returned name is the same medication after removing strength
    // and dosage-form words.  Misspellings and brand/generic substitutions require
    // human confirmation rather than a silent substitution.
    const approx = await getJson(`${BASE}/approximateTerm.json?term=${encodeURIComponent(trimmed)}&maxEntries=20`);
    const candidates = approx?.approximateGroup?.candidate ?? [];
    const requestedName = comparableName(trimmed);
    const matching = candidates.filter((candidate) => comparableName(candidate?.name) === requestedName && candidate?.rxcui);
    const uniqueMatches = [...new Map(matching.map((candidate) => [candidate.rxcui, candidate])).values()];

    if (uniqueMatches.length !== 1) {
      return unresolved(
        trimmed,
        uniqueMatches.length > 1
          ? 'RxNorm returned more than one equally named approximate candidate.'
          : 'RxNorm did not return an approximate candidate whose name clearly matches the requested medication.',
        candidates
      );
    }

    const candidate = uniqueMatches[0];
    rxCui = candidate.rxcui;
    normalization = {
      status: 'resolved',
      method: 'approximate_name_verified',
      queriedName: trimmed,
      returnedName: candidate.name,
      candidate: { rxcui: candidate.rxcui, score: candidate.score, rank: candidate.rank, source: candidate.source },
    };
>>>>>>> main
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
    status: 'resolved',
    rxCui,
<<<<<<< HEAD
    ingredientRxCui: primaryIngredient.rxCui ?? rxCui,
    ingredientName: primaryIngredient.name ?? trimmed,
    ingredients,
=======
    // When the name is already an ingredient, RxNorm returns no related "IN" concept.
    ingredientRxCui: ingredientRxCui ?? rxCui,
    ingredientName: ingredientName ?? trimmed,
    normalization,
>>>>>>> main
  };
}
