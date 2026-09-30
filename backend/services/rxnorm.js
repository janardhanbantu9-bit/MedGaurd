export async function normalizeDrug(name) {
  const trimmed = String(name || '').trim();

  if (!trimmed) {
    throw new Error('Drug name is required');
  }

  const url =
    `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(trimmed)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`RxNorm request failed: ${response.status}`);
  }

  const data = await response.json();
  const rxCui = data?.idGroup?.rxnormId?.[0] ?? null;

  return {
    input: trimmed,
    rxCui,
  };
}
