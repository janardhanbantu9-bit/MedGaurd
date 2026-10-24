import { extractMedications } from '../backend/pipeline/analyzePrescription.js';
import { fail } from './_http.js';
import { requireUser } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  const rateCheck = checkRateLimit(`extract:${user.id}`, 30, 60000);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: `Too many requests. Please wait ${rateCheck.retryAfterSeconds} seconds.` });
  }

  try {
    const text = String(req.body?.prescription ?? '');
    if (!text.trim()) {
      return res.status(400).json({ error: 'Prescription text is required' });
    }
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Prescription text must be 5000 characters or fewer' });
    }

    const result = await extractMedications(text);
    return res.status(200).json(result);
  } catch (error) {
    return fail(res, error, 'Extraction failed');
  }
}
