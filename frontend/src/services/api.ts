import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export type ApiMedication = {
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  rxCui?: string | null;
};

// Shape used by the review table.
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
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export async function extractMedications(prescription: string): Promise<UiMedication[]> {
  const data = await post<{ medications: ApiMedication[] }>('/api/extract', { prescription });
  return data.medications.map((m, i) => ({
    id: `em${Date.now()}-${i}`,
    name: m.name,
    dose: m.dose ?? '',
    freq: m.frequency ?? '',
    route: m.route ?? '',
    intendedDuration: m.duration ?? '',
  }));
}

const SEVERITY_UI = {
  high: { status: 'High Risk', icon: AlertTriangle },
  review: { status: 'Needs Review', icon: AlertCircle },
  safe: { status: 'Passed', icon: CheckCircle2 },
} as const;

export function toUiFinding(finding: any) {
  const ui = SEVERITY_UI[finding.severity as keyof typeof SEVERITY_UI] ?? SEVERITY_UI.review;
  return {
    ...finding,
    status: ui.status,
    icon: ui.icon,
    affectedMeds: finding.affectedMeds ?? [],
    evidenceSource: finding.evidenceSource ?? 'Not specified',
  };
}

export async function analyzeMedications(patient: unknown, medications: UiMedication[]) {
  const data = await post<any>('/api/analyze', {
    patient,
    medications: medications.map((m) => ({
      name: m.name,
      dose: m.dose,
      frequency: m.freq,
      route: m.route,
      duration: m.intendedDuration,
    })),
  });
  return { ...data, findings: (data.findings ?? []).map(toUiFinding) };
}

export async function getPatients() {
  let response: Response;
  try {
    response = await fetch('/api/patients');
  } catch {
    throw new Error('Could not reach the server.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Could not load patients (${response.status})`);
  return (data?.patients ?? []) as any[];
}
