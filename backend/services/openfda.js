const ENDPOINT = 'https://api.fda.gov/drug/label.json';

async function query(search) {
  const params = [`search=${encodeURIComponent(search)}`, 'limit=1'];
  if (process.env.OPENFDA_API_KEY) {
    params.push(`api_key=${encodeURIComponent(process.env.OPENFDA_API_KEY)}`);
  }

  const response = await fetch(`${ENDPOINT}?${params.join('&')}`, {
    signal: AbortSignal.timeout(5000),
  });

  // openFDA answers 404 when nothing matches - that is "no label found"
  if (response.status === 404) return null;
  if (response.status === 429) {
    throw new Error('openFDA API rate limit reached (429)');
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`openFDA request failed: ${response.status} ${body.slice(0, 150)}`.trim());
  }

  const data = await response.json();
  return data?.results?.[0] ?? null;
}

/** Looks up the most relevant human drug label. `names` may be a string or a list of candidate names. */
export async function getDrugLabel(names) {
  const candidates = [...new Set([].concat(names).map((n) => String(n || '').trim().replace(/"/g, '')).filter(Boolean))];
  if (candidates.length === 0) throw new Error('Drug name is required');

  for (const name of candidates) {
    // Group the searches into a single query to prevent sequential request waterfalls
    const combinedSearch = `(openfda.generic_name:"${name}" OR openfda.brand_name:"${name}" OR openfda.substance_name:"${name}")`;
    const label = await query(combinedSearch);
    if (label) return label;
  }
  return null;
}
