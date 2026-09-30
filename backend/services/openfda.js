export async function getDrugLabel(drugName) {
  const trimmed = String(drugName || '').trim();

  if (!trimmed) {
    throw new Error('Drug name is required');
  }

  const params = new URLSearchParams({
    limit: '1',
    search: `openfda.generic_name:${trimmed}`,
  });

  if (process.env.OPENFDA_API_KEY) {
    params.set('api_key', process.env.OPENFDA_API_KEY);
  }

  const response = await fetch(
    `https://api.fda.gov/drug/label.json?${params.toString()}`
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`openFDA request failed: ${response.status} ${body}`.trim());
  }

  const data = await response.json();
  return data?.results?.[0] ?? null;
}
