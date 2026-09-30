import { requireUser } from './_auth.js';
import { getOwnedPatientContext } from './_patient.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const patient = await getOwnedPatientContext(user.id);
    return res.status(200).json({ patients: patient ? [patient] : [] });
  } catch (error) {
    console.error('MediGuard patients error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to load your profile',
    });
  }
}
