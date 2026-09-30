const BASE = 'https://rxnav.nlm.nih.gov/REST';

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`RxNorm request failed: ${response.status}`);
  return response.json();
}

export async function normalizeDrug(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Drug name is required');

  let rxCui = null;
  const exact = await getJson(`${BASE}/rxcui.json?name=${encodeURIComponent(trimmed)}&search=2`);
  rxCui = exact?.idGroup?.rxnormId?.[0] ?? null;

  if (!rxCui) {
    // Handles misspellings and partial names.
    const approx = await getJson(`${BASE}/approximateTerm.json?term=${encodeURIComponent(trimmed)}&maxEntries=1`);
    rxCui = approx?.approximateGroup?.candidate?.[0]?.rxcui ?? null;
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
    rxCui,
    // When the name is already an ingredient, RxNorm returns no related "IN" concept.
    ingredientRxCui: ingredientRxCui ?? rxCui,
    ingredientName: ingredientName ?? trimmed,
  };
}
