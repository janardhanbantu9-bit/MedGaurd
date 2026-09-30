export type AnalyzeRequest = {
  patient: unknown;
  prescription?: string;
};

export async function analyzePrescription(payload: AnalyzeRequest) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Prescription analysis request failed');
  }

  return response.json();
}
