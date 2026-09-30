const BASE = 'https://rxnav.nlm.nih.gov/REST/rxclass';

/**
 * Returns the drug classes (ATC, EPC, ...) for an RxNorm ingredient.
 * Best-effort: returns [] on failure so one flaky lookup doesn't fail the whole analysis.
 */
export async function getDrugClasses(rxcui) {
  if (!rxcui) return [];

  try {
    const response = await fetch(`${BASE}/class/byRxcui.json?rxcui=${encodeURIComponent(rxcui)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];

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
  } catch (error) {
    console.warn(`RxClass lookup failed for ${rxcui}:`, error.message);
    return [];
  }
}
