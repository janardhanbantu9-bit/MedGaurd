export default async function handler(req, res) {
  return res.status(200).json({
    sources: [
      { name: 'RxNorm', status: 'planned' },
      { name: 'RxClass', status: 'planned' },
      { name: 'openFDA', status: 'planned' },
      { name: 'DailyMed', status: 'planned' }
    ]
  });
}
