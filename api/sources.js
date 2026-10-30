import { requireUser } from './_auth.js';

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  return res.status(200).json({
    sources: [
      { name: 'Groq (extraction and explanations)', status: 'active' },
      { name: 'RxNorm', status: 'active' },
      { name: 'RxClass', status: 'active' },
      { name: 'openFDA', status: 'active' },
      { name: 'DailyMed', status: 'active' },
    ],
  });
}
