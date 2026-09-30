export type Medication = {
  id?: string;
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  rxCui?: string;
};

export type SafetyFinding = {
  id?: string;
  category: string;
  severity: 'high' | 'review' | 'safe';
  title: string;
  summary: string;
  evidence?: unknown[];
  action?: string;
};
