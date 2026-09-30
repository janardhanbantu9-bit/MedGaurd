import { getSupabase } from '../backend/services/supabase.js';
import { requireUser } from './_auth.js';
import { getOwnedPatient } from './_patient.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  const patientId = String(req.query?.patientId ?? '');
  if (!UUID.test(patientId)) return res.status(400).json({ error: 'A valid patientId is required' });

  try {
    const patient = await getOwnedPatient(user.id);
    if (!patient || patient.id !== patientId) {
      return res.status(403).json({ error: 'You do not have access to this patient history' });
    }

    const { data, error } = await getSupabase()
      .from('analyses')
      .select('id, created_at, status, summary, findings, extracted_medications, prescription_text')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return res.status(200).json({ analyses: data ?? [] });
  } catch (error) {
    console.error('MediGuard history error:', error);
    return res.status(500).json({ error: error?.message || 'Could not load safety history' });
  }
}
