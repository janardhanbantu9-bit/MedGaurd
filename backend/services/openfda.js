const ENDPOINT = 'https://api.fda.gov/drug/label.json';

async function query(search) {
  const params = [`search=${encodeURIComponent(search)}`, 'limit=1'];
  if (process.env.OPENFDA_API_KEY) params.push(`api_key=${encodeURIComponent(process.env.OPENFDA_API_KEY)}`);

  const response = await fetch(`${ENDPOINT}?${params.join('&')}`, { signal: AbortSignal.timeout(8000) });

  // openFDA answers 404 when nothing matches - that is "no label", not an error.
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`openFDA request failed: ${response.status} ${body.slice(0, 200)}`.trim());
  }

  const data = await response.json();
  return data?.results?.[0] ?? null;
}

/** Looks up the most relevant human drug label. `names` may be a string or a list of candidate names. */
export async function getDrugLabel(names) {
  const candidates = [...new Set([].concat(names).map((n) => String(n || '').trim().replace(/"/g, '')).filter(Boolean))];
  if (candidates.length === 0) throw new Error('Drug name is required');

  const rx = 'openfda.product_type:"HUMAN PRESCRIPTION DRUG"';

  for (const name of candidates) {
    const attempts = [
      `openfda.generic_name:"${name}" AND ${rx}`,
      `openfda.generic_name:"${name}"`,
      `openfda.substance_name:"${name}"`,
      `openfda.brand_name:"${name}"`,
    ];
    for (const search of attempts) {
      const label = await query(search);
      if (label) return label;
    }
  }
  return null;
}
