export default async function handler(req, res) {
  return res.status(200).json({
    sources: [
      { name: 'Groq (extraction and explanations)', status: process.env.GROQ_API_KEY ? 'configured' : 'missing GROQ_API_KEY' },
      { name: 'RxNorm', status: 'active' },
      { name: 'RxClass', status: 'active' },
      { name: 'openFDA', status: process.env.OPENFDA_API_KEY ? 'active (api key)' : 'active (no api key, rate limited)' },
      { name: 'DailyMed', status: 'planned' },
    ],
  });
}
