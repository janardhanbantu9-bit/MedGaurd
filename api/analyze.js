import { analyzePrescription } from '../backend/pipeline/analyzePrescription.js';
import { getSupabase } from '../backend/services/supabase.js';
import { fail } from './_http.js';

const HISTORY_SAVE_FAILURE = 'The safety check completed, but history could not be saved.';

/** Best-effort history save. Never fails the safety analysis. */
async function saveAnalysis(patient, body, result) {
  try {
    if (!patient?.id || !/^[0-9a-f-]{36}$/i.test(patient.id)) {
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

  try {
    const body = req.body || {};
    const result = await analyzePrescription({
      patient: body.patient || {},
      prescription: body.prescription,
      medications: body.medications,
    });
    const persistence = await saveAnalysis(body.patient, body, result);
    return res.status(200).json({ ...result, persistence });
  } catch (error) {
    return fail(res, error, 'Analysis failed');
  }
}
