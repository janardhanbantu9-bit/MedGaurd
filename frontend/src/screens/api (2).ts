import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export type ApiMedication = {
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  rxCui?: string | null;
};

export type UiMedication = {
  id: string;
  name: string;
  dose: string;
  freq: string;
  route: string;
  intendedDuration: string;
};

async function post<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data as T;
}

function toUiMedication(m: ApiMedication, i: number): UiMedication {
  return { id: `em${Date.now()}-${i}`, name: m.name, dose: m.dose ?? '', freq: m.frequency ?? '', route: m.route ?? '', intendedDuration: m.duration ?? '' };
}

export async function extractMedications(prescription: string): Promise<UiMedication[]> {
  const data = await post<{ medications: ApiMedication[] }>('/api/extract', { prescription });
  return data.medications.map(toUiMedication);
}

export async function extractMedicationImage(file: File): Promise<UiMedication[]> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a prescription image file.');
  if (file.size > 4 * 1024 * 1024) throw new Error('Choose an image smaller than 4 MB.');
  const image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image'));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
  const data = await post<{ medications: ApiMedication[] }>('/api/vision-extract', { image });
  return data.medications.map(toUiMedication);
}

const SEVERITY_UI = {
  high: { status: 'High Risk', icon: AlertTriangle },
  review: { status: 'Needs Review', icon: AlertCircle },
  safe: { status: 'No Flagged Conflict', icon: CheckCircle2 },
} as const;

export function toUiFinding(finding: any) {
  const ui = SEVERITY_UI[finding.severity as keyof typeof SEVERITY_UI] ?? SEVERITY_UI.review;
  return { ...finding, status: ui.status, icon: ui.icon, affectedMeds: finding.affectedMeds ?? [], evidenceSource: finding.evidenceSource ?? 'Not specified' };
}

export async function analyzeMedications(patient: unknown, medications: UiMedication[]) {
  const data = await post<any>('/api/analyze', {
    patient,
    medications: medications.map(m => ({ name: m.name, dose: m.dose, frequency: m.freq, route: m.route, duration: m.intendedDuration })),
  });
  return { ...data, findings: (data.findings ?? []).map(toUiFinding) };
}

export async function getPatients() {
  let response: Response;
  try { response = await fetch('/api/patients'); } catch { throw new Error('Could not reach the server.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Could not load patients (${response.status})`);
  return (data?.patients ?? []) as any[];
}

export async function getSafetyHistory(patientId: string) {
  const query = new URLSearchParams({ patientId });
  let response: Response;
  try { response = await fetch(`/api/history?${query}`); } catch { throw new Error('Could not reach the server.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Could not load safety history (${response.status})`);
  return data?.analyses ?? [];
}

export async function chatWithAI(message: string, patient: unknown) {
  const data = await post<{ answer: string }>('/api/chat', { message, patient });
  return data.answer;
}
