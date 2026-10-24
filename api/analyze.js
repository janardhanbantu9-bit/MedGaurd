import { analyzePrescription } from '../backend/pipeline/analyzePrescription.js';
import { getSupabase } from '../backend/services/supabase.js';
import { fail } from './_http.js';
import { requireUser } from './_auth.js';
import { getOwnedPatientContext } from './_patient.js';
import { checkRateLimit } from './_rateLimit.js';

const HISTORY_SAVE_FAILURE = 'The safety check completed, but history could not be saved.';
const MAX_PRESCRIPTION_LENGTH = 5000;
const MAX_MEDICATIONS = 15;

/** Best-effort history save. Never fails the safety analysis. */
async function saveAnalysis(patient, body, result) {
  try {
    if (!patient?.id) {
      return { saved: false, analysisId: null, reason: HISTORY_SAVE_FAILURE };
    }
    const { data, error } = await getSupabase().from('analyses').insert({
      patient_id: patient.id,
      prescription_text: String(body.prescription || JSON.stringify(body.medications ?? [])).slice(0, 5000),
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

  const rateCheck = checkRateLimit(`analyze:${user.id}`, 20, 60000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Too many safety analysis requests. Please wait ${rateCheck.retryAfterSeconds} seconds before checking again.`,
    });
  }

  try {
    const body = req.body || {};

    if (body.prescription && typeof body.prescription === 'string' && body.prescription.length > MAX_PRESCRIPTION_LENGTH) {
      return res.status(400).json({ error: `Prescription text exceeds maximum length of ${MAX_PRESCRIPTION_LENGTH} characters.` });
    }

    if (Array.isArray(body.medications) && body.medications.length > MAX_MEDICATIONS) {
      return res.status(400).json({ error: `Safety check accepts at most ${MAX_MEDICATIONS} medications at a time.` });
    }

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
