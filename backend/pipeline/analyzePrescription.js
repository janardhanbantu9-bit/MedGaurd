import { extractPrescription } from '../services/groq.js';
import { normalizeDrug } from '../services/rxnorm.js';
import { getDrugLabel } from '../services/openfda.js';
import { supabaseAdmin } from '../services/supabase.js';

async function getPatient(patientId) {
  const { data: patient, error: patientError } = await supabaseAdmin
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();

  if (patientError) throw patientError;

  const [allergiesResult, diagnosesResult, medicationsResult] = await Promise.all([
    supabaseAdmin.from('allergies').select('*').eq('patient_id', patientId).order('created_at'),
    supabaseAdmin.from('diagnoses').select('*').eq('patient_id', patientId).order('created_at'),
    supabaseAdmin.from('medications').select('*').eq('patient_id', patientId).eq('status', 'Active').order('created_at'),
  ]);

  if (allergiesResult.error) throw allergiesResult.error;
  if (diagnosesResult.error) throw diagnosesResult.error;
  if (medicationsResult.error) throw medicationsResult.error;

  return {
    ...patient,
    allergies: allergiesResult.data || [],
    diagnoses: diagnosesResult.data || [],
    medications: medicationsResult.data || [],
  };
}

function toPatientView(patient) {
  return {
    id: patient.id,
    name: patient.name,
    mrn: patient.mrn,
    age: patient.age,
    sex: patient.sex,
    weight: patient.weight_kg ? `${patient.weight_kg} kg` : '',
    height: patient.height_cm ? `${patient.height_cm} cm` : '',
    allergies: patient.allergies.map((a) => ({
      name: a.allergen,
      severity: a.severity,
      reaction: a.reaction,
    })),
    diagnoses: patient.diagnoses.map((d) => ({
      name: d.diagnosis,
      status: d.status,
      date: d.diagnosed_on,
    })),
    currentMeds: patient.medications.map((m) => ({
      id: m.id,
      name: m.name,
      dose: m.dose,
      freq: m.frequency,
      route: m.route,
      status: m.status,
      start: m.started_on,
      rxCui: m.rx_cui,
    })),
  };
}

export async function analyzePrescription({ patientId, prescription = '' }) {
  if (!patientId || typeof patientId !== 'string') {
    throw new Error('patientId is required');
  }

  if (!prescription || typeof prescription !== 'string') {
    throw new Error('Prescription text is required');
  }

  const patient = await getPatient(patientId);
  const extracted = await extractPrescription(prescription);
  const medications = Array.isArray(extracted.medications) ? extracted.medications : [];

  const normalized = await Promise.all(
    medications.map(async (med) => {
      const drug = await normalizeDrug(med.name);
      let label = null;

      try {
        label = await getDrugLabel(med.name);
      } catch (error) {
        console.warn(`openFDA lookup failed for ${med.name}:`, error?.message || error);
      }

      return {
        ...med,
        ...drug,
        labelAvailable: Boolean(label),
      };
    })
  );

  // Safety rules will be connected next. Keep findings empty rather than inventing results.
  const findings = [];
  const summary = {
    high: findings.filter((f) => f.severity === 'high').length,
    review: findings.filter((f) => f.severity === 'review').length,
    safe: findings.filter((f) => f.severity === 'safe').length,
  };

  const { data: analysis, error: analysisError } = await supabaseAdmin
    .from('analyses')
    .insert({
      patient_id: patientId,
      prescription_text: prescription,
      status: 'extraction_and_normalization_complete',
      extracted_medications: normalized,
      findings,
      summary,
    })
    .select('id, created_at, status')
    .single();

  if (analysisError) throw analysisError;

  return {
    analysisId: analysis.id,
    createdAt: analysis.created_at,
    status: analysis.status,
    patient: toPatientView(patient),
    medications: normalized,
    findings,
    summary,
  };
}
