const BASE = 'https://rxnav.nlm.nih.gov/REST';

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

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`RxNorm request failed: ${response.status}`);
  return response.json();
}

export async function normalizeDrug(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Drug name is required');

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
  }

  let ingredientRxCui = null;
  let ingredientName = null;

  if (rxCui) {
    try {
      const related = await getJson(`${BASE}/rxcui/${rxCui}/related.json?tty=IN`);
      const concept = related?.relatedGroup?.conceptGroup
        ?.flatMap((group) => group.conceptProperties ?? [])
        ?.[0];
      ingredientRxCui = concept?.rxcui ?? null;
      ingredientName = concept?.name ?? null;
    } catch {
      /* ingredient lookup is best-effort */
    }
  }

  return {
    input: trimmed,
    status: 'resolved',
    rxCui,
    // When the name is already an ingredient, RxNorm returns no related "IN" concept.
    ingredientRxCui: ingredientRxCui ?? rxCui,
    ingredientName: ingredientName ?? trimmed,
    normalization,
  };
}
