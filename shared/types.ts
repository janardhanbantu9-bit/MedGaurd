export type Medication = {
  id?: string;
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  rxCui?: string | null;
  ingredientName?: string;
  labelAvailable?: boolean;
};

export type Evidence = {
  source: string;
  snippet: string;
};

export type SafetyFinding = {
  id?: string;
  category: string;
  severity: 'high' | 'review' | 'safe';
  title: string;
  summary: string;
  affectedMeds?: string[];
  patientContext?: string[];
  mechanism?: string;
  clinicalConsiderations?: string;
  evidenceSource?: string;
  evidence?: Evidence[];
  action?: string;
};

export type AnalysisResult = {
  medications: Medication[];
  findings: SafetyFinding[];
  summary: { high: number; review: number; safe: number };
  checksPerformed: number;
  warnings: string[];
  status: string;
};
