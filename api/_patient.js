import { getSupabase } from '../backend/services/supabase.js';

export async function getOwnedPatient(userId) {
  const { data, error } = await getSupabase()
    .from('patients')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getOwnedPatientContext(userId) {
  const patient = await getOwnedPatient(userId);
  if (!patient) return null;

  const supabaseAdmin = getSupabase();
  const [allergiesResult, diagnosesResult, medicationsResult] = await Promise.all([
    supabaseAdmin.from('allergies').select('*').eq('patient_id', patient.id).order('created_at'),
    supabaseAdmin.from('diagnoses').select('*').eq('patient_id', patient.id).order('created_at'),
    supabaseAdmin.from('medications').select('*').eq('patient_id', patient.id).eq('status', 'Active').order('created_at'),
  ]);

  if (allergiesResult.error) throw allergiesResult.error;
  if (diagnosesResult.error) throw diagnosesResult.error;
  if (medicationsResult.error) throw medicationsResult.error;

  return {
    id: patient.id,
    userId: patient.user_id,
    name: patient.name,
    mrn: patient.mrn,
    age: patient.age,
    sex: patient.sex,
    weight: patient.weight_kg ? `${patient.weight_kg} kg` : '',
    height: patient.height_cm ? `${patient.height_cm} cm` : '',
    allergies: (allergiesResult.data || []).map((a) => ({ name: a.allergen, severity: a.severity, reaction: a.reaction })),
    diagnoses: (diagnosesResult.data || []).map((d) => ({ name: d.diagnosis, status: d.status, date: d.diagnosed_on })),
    currentMeds: (medicationsResult.data || []).map((m) => ({
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
