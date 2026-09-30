import { getSupabase } from '../backend/services/supabase.js';

export default async function handler(_req, res) {
  const status = {
    ok: true,
    service: 'mediguard',
    groq: process.env.GROQ_API_KEY ? 'configured' : 'missing GROQ_API_KEY',
    supabase: 'not configured',
  };

  try {
    const { error } = await getSupabase().from('patients').select('id').limit(1);
    if (error) throw error;
    status.supabase = 'connected';
  } catch (error) {
    status.supabase = `error: ${error.message}`;
  }

  // The app still works on the demo patient without Supabase, so this is not a 500.
  return res.status(200).json(status);
}
