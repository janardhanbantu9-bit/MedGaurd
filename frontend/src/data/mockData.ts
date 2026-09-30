import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

// Demo-only data copied from the supplied UI prototype.
// Replace these values with API-backed data when the backend is wired.
export const colors = {
  bg: '#F7FAF8',
  surface: '#FFFFFF',
  primary: '#087F5B',
  darkGreen: '#064E3B',
  softGreen: '#E8F5EF',
  textMain: '#17211B',
  textMuted: '#66736B',
  border: '#DCE5DF',
};

export const mockPatients = [
  {
    id: 'p1',
    name: 'Eleanor Vance',
    mrn: 'MRN-847291',
    age: 68,
    sex: 'Female',
    weight: '64 kg',
    height: '165 cm',
    allergies: [
      { name: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis' },
      { name: 'Sulfa Drugs', severity: 'Moderate', reaction: 'Rash' }
    ],
    diagnoses: [
      { name: 'Type 2 Diabetes Mellitus', status: 'Active', date: '2015-04-12' },
      { name: 'Atrial Fibrillation', status: 'Active', date: '2018-09-03' },
      { name: 'Hypertension', status: 'Active', date: '2010-11-20' },
      { name: 'Osteoarthritis', status: 'Active', date: '2020-01-15' }
    ],
    currentMeds: [
      { id: 'm1', name: 'Metformin', dose: '500 mg', freq: 'BID', route: 'Oral', status: 'Active', start: '2015-05-01' },
      { id: 'm2', name: 'Warfarin', dose: '5 mg', freq: 'Daily', route: 'Oral', status: 'Active', start: '2018-09-10' },
      { id: 'm3', name: 'Lisinopril', dose: '10 mg', freq: 'Daily', route: 'Oral', status: 'Active', start: '2010-11-25' },
      { id: 'm4', name: 'Atorvastatin', dose: '20 mg', freq: 'Daily at bedtime', route: 'Oral', status: 'Active', start: '2019-02-14' }
    ]
  }
];

export const demoExtractedMeds = [
  { id: 'em1', name: 'Ibuprofen', dose: '600 mg', freq: 'TID', route: 'Oral', intendedDuration: '7 days' },
  { id: 'em2', name: 'Glimepiride', dose: '2 mg', freq: 'Daily', route: 'Oral', intendedDuration: '30 days' },
  { id: 'em3', name: 'Vitamin D3', dose: '2000 IU', freq: 'Daily', route: 'Oral', intendedDuration: 'Ongoing' }
];

export const demoFindings = [
  {
    id: 'f1',
    category: 'Drug–Drug Interaction',
    severity: 'high', // high, review, safe
    status: 'High Risk',
    icon: AlertTriangle,
    affectedMeds: ['Ibuprofen (New)', 'Warfarin (Current)'],
    title: 'Increased Risk of Bleeding',
    summary: 'Concurrent use of NSAIDs (Ibuprofen) and anticoagulants (Warfarin) significantly increases the risk of gastrointestinal bleeding and may alter the anticoagulant effect.',
    mechanism: 'NSAIDs inhibit platelet aggregation and can cause gastric mucosal damage. They may also displace warfarin from protein binding sites, transiently increasing INR.',
    evidenceSource: 'Clinical Pharmacology Interaction Database; AHA Guidelines.',
    clinicalConsiderations: 'Evaluate if the NSAID is strictly necessary. If pain relief is needed, consider alternatives with lower bleeding risk (e.g., Acetaminophen, depending on hepatic function). If NSAID must be used, close monitoring of INR and signs of bleeding is required.',
    action: 'Clinician review highly recommended prior to dispensing.'
  },
  {
    id: 'f2',
    category: 'Duplicate Therapy',
    severity: 'review',
    status: 'Needs Review',
    icon: AlertCircle,
    affectedMeds: ['Glimepiride (New)', 'Metformin (Current)'],
    title: 'Overlapping Antidiabetic Therapy',
    summary: 'Patient is already on Metformin. Addition of a sulfonylurea (Glimepiride) represents therapy intensification.',
    mechanism: 'Both agents lower blood glucose through different mechanisms (insulin sensitization vs. insulin secretagogue).',
    evidenceSource: 'ADA Standards of Medical Care in Diabetes.',
    clinicalConsiderations: 'This is a common and often intentional combination for uncontrolled T2DM. However, ensure this is intentional intensification and monitor for hypoglycemia, particularly during the initiation phase of Glimepiride.',
    action: 'Verify intent of therapy intensification.'
  },
  {
    id: 'f3',
    category: 'Drug-Disease Conflict',
    severity: 'review',
    status: 'Needs Review',
    icon: AlertCircle,
    affectedMeds: ['Ibuprofen (New)'],
    patientContext: ['Hypertension (Active Diagnosis)'],
    title: 'Potential Blood Pressure Elevation',
    summary: 'NSAIDs like Ibuprofen can reduce the antihypertensive effect of ACE inhibitors (like Lisinopril) and may cause fluid retention, exacerbating hypertension.',
    mechanism: 'Inhibition of renal prostaglandin synthesis, leading to sodium and water retention.',
    evidenceSource: 'Joint National Committee (JNC) Guidelines.',
    clinicalConsiderations: 'Short-term use (7 days) is generally lower risk but still warrants monitoring. Advise patient to monitor blood pressure at home if possible.',
    action: 'Monitor blood pressure during course of therapy.'
  },
  {
    id: 'f4',
    category: 'General Safety',
    severity: 'safe',
    status: 'Passed',
    icon: CheckCircle2,
    affectedMeds: ['Vitamin D3 (New)'],
    title: 'No Significant Interactions Detected',
    summary: 'Vitamin D3 at 2000 IU daily does not have known severe interactions with the patient\'s current medication profile or diagnoses.',
    mechanism: 'N/A',
    evidenceSource: 'Standard Reference Database v4.2',
    clinicalConsiderations: 'Routine monitoring as appropriate for patient\'s age and condition.',
    action: 'Proceed normally.'
  }
];
