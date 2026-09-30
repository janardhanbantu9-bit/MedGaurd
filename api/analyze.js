import { analyzePrescription } from '../backend/pipeline/analyzePrescription.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const result = await analyzePrescription({
      patientId: body.patientId,
      prescription: body.prescription,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('MediGuard analysis error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Analysis failed',
    });
  }
}
