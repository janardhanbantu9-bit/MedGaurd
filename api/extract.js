import { extractMedications } from '../backend/pipeline/analyzePrescription.js';
import { fail } from './_http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await extractMedications(req.body?.prescription);
    return res.status(200).json(result);
  } catch (error) {
    return fail(res, error, 'Extraction failed');
  }
}
