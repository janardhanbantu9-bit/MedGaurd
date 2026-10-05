import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) {
    throw new Error(
      'Supabase Auth is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Supabase session lookup failed:', error);
    throw new Error(`Authentication session error: ${error.message}`);
  }

  const token = data.session?.access_token;
  if (!token) throw new Error('You are not signed in. Please sign in again.');

  return { Authorization: `Bearer ${token}` };
}

async function readResponse(response: Response): Promise<any> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || `Request failed (${response.status} ${response.statusText})`
    );
  }
  return data;
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  const auth = await authHeaders();
  let response: Response;

  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(`POST ${path} failed:`, error);
    throw new Error(`Could not reach ${path}. Check that the API server is running.`);
  }

  return (await readResponse(response)) as T;
}

async function get<T>(path: string): Promise<T> {
  const auth = await authHeaders();
  let response: Response;

  try {
    response = await fetch(path, { method: 'GET', headers: auth });
  } catch (error) {
    console.error(`GET ${path} failed:`, error);
    throw new Error(`Could not reach ${path}. Check that the API server is running.`);
  }

  return (await readResponse(response)) as T;
}

function toUiMedication(m: ApiMedication, i: number): UiMedication {
  return {
    id: `em${Date.now()}-${i}`,
    name: m.name,
    dose: m.dose ?? '',
    freq: m.frequency ?? '',
    route: m.route ?? '',
    intendedDuration: m.duration ?? '',
  };
}

export type OnboardingPayload = {
  age: number | string;
  weight: number | string;
  height: number | string;
  medications: { name: string; dose?: string; frequency?: string; route?: string }[] | string[];
  currentConditions: (string | { name: string })[];
  previousConditions: (string | { name: string })[];
  allergies: { name: string; severity?: string; reaction?: string }[] | string[];
};

export async function getProfile() {
  try {
    const data = await get<{ profile?: any }>('/api/profile');
    return data?.profile ?? null;
  } catch (error) {
    if (error instanceof Error && /404|no profile|not found/i.test(error.message)) return null;
    throw error;
  }
}

export async function saveOnboardingProfile(payload: OnboardingPayload) {
  const data = await post<{ profile: any; created?: boolean; duplicate?: boolean }>(
    '/api/profile',
    payload
  );
  return data.profile;
}

export async function extractMedications(prescription: string): Promise<UiMedication[]> {
  const data = await post<{ medications: ApiMedication[] }>('/api/extract', { prescription });
  return (data.medications ?? []).map(toUiMedication);
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
  return (data.medications ?? []).map(toUiMedication);
}

const SEVERITY_UI = {
  high: { status: 'High Risk', icon: AlertTriangle },
  review: { status: 'Needs Review', icon: AlertCircle },
  safe: { status: 'No Flagged Conflict', icon: CheckCircle2 },
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
  const data = await get<{ patients?: any[] }>('/api/patients');
  return data?.patients ?? [];
}

export async function getSafetyHistory(patientId: string) {
  const query = new URLSearchParams({ patientId });
  const data = await get<{ analyses?: any[] }>(`/api/history?${query}`);
  return data?.analyses ?? [];
}

export async function chatWithAI(message: string, patient: unknown) {
  const data = await post<{ answer: string }>('/api/chat', { message, patient });
  return data.answer;
}
