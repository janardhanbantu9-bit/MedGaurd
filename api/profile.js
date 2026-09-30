import { getSupabase } from '../backend/services/supabase.js';
import { requireUser } from './_auth.js';

function fallbackName(user) {
  const metadataName = String(user.user_metadata?.full_name ?? '').trim();
  if (metadataName) return metadataName.slice(0, 100);

  const emailName = String(user.email ?? '').split('@')[0].trim();
  return (emailName || 'MediGuard user').slice(0, 100);
}

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = getSupabase();
    const existing = await supabaseAdmin
      .from('patients')
      .select('id, user_id, name, mrn, age, sex, weight_kg, height_cm, clinical_notes')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing.error) throw existing.error;
    if (existing.data) return res.status(200).json({ patient: existing.data, created: false });

    const name = String(req.body?.name ?? '').trim().slice(0, 100) || fallbackName(user);
    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert({
        user_id: user.id,
        mrn: `USER-${user.id}`,
        name,
        clinical_notes: 'User profile. Health context has not been completed yet.',
      })
      .select('id, user_id, name, mrn, age, sex, weight_kg, height_cm, clinical_notes')
      .single();

    if (error) throw error;
    return res.status(201).json({ patient: data, created: true });
  } catch (error) {
    console.error('MediGuard profile error:', error);
    return res.status(500).json({ error: error?.message || 'Could not create your profile' });
  }
}
