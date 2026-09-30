import { analyzePrescription } from '../backend/pipeline/analyzePrescription.js';
import { getSupabase } from '../backend/services/supabase.js';
import { fail } from './_http.js';
import { requireUser } from './_auth.js';
import { getOwnedPatientContext } from './_patient.js';

const HISTORY_SAVE_FAILURE = 'The safety check completed, but history could not be saved.';

/** Best-effort history save. Never fails the safety analysis. */
async function saveAnalysis(patient, body, result) {
  try {
    if (!patient?.id) {
      return { saved: false, analysisId: null, reason: HISTORY_SAVE_FAILURE };
    }
    const { data, error } = await getSupabase().from('analyses').insert({
      patient_id: patient.id,
      prescription_text: body.prescription || JSON.stringify(body.medications ?? []),
      status: result.status,
      extracted_medications: result.medications,
      findings: result.findings,
      summary: result.summary,
    }).select('id').single();
    if (error) throw error;
    return { saved: true, analysisId: data.id };
  } catch (error) {
    console.error('Could not save analysis to Supabase:', error);
    return { saved: false, analysisId: null, reason: HISTORY_SAVE_FAILURE };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const body = req.body || {};
    const patient = await getOwnedPatientContext(user.id);
    if (!patient) {
      return res.status(400).json({ error: 'Your health profile is not ready yet' });
    }

    const result = await analyzePrescription({
      patient,
      prescription: body.prescription,
      medications: body.medications,
    });
    const persistence = await saveAnalysis(patient, body, result);
    return res.status(200).json({ ...result, persistence });
  } catch (error) {
    return fail(res, error, 'Analysis failed');
  }
}
