import { supabaseAdmin } from '../backend/services/supabase.js';

export default async function handler(_req, res) {
  try {
    const { error } = await supabaseAdmin.from('patients').select('id').limit(1);
    if (error) throw error;

    return res.status(200).json({ ok: true, service: 'mediguard', supabase: 'connected' });
  } catch (error) {
    console.error('MediGuard health error:', error);
    return res.status(500).json({ ok: false, service: 'mediguard', supabase: 'error' });
  }
}
