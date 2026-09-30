export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ patients: [], message: 'TODO: connect Supabase patients table.' });
  }

  return res.status(501).json({ error: 'Patients API not implemented yet.' });
}
