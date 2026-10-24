const BASE = 'https://rxnav.nlm.nih.gov/REST/rxclass';

/**
 * Returns the drug classes (ATC, EPC, ...) for an RxNorm ingredient.
 * Throws on network failure or timeout so the pipeline knows classes could not be verified.
 */
export async function getDrugClasses(rxcui) {
  if (!rxcui) return [];

  const response = await fetch(`${BASE}/class/byRxcui.json?rxcui=${encodeURIComponent(rxcui)}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) {
    throw new Error(`RxClass lookup failed with status ${response.status}`);
  }

  const data = await response.json();
  const seen = new Set();
  const classes = [];

  for (const info of data?.rxclassDrugInfoList?.rxclassDrugInfo ?? []) {
    const item = info.rxclassMinConceptItem;
    if (!item?.classId) continue;
    const key = `${item.classType}:${item.classId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    classes.push({
      classId: item.classId,
      className: item.className,
      classType: item.classType,
      source: info.relaSource,
    });
  }
  return classes;
}
