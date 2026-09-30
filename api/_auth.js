import { getSupabase } from '../backend/services/supabase.js';

function bearerToken(req) {
  const header = String(req.headers?.authorization ?? '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

export async function requireUser(req, res) {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  try {
    const { data, error } = await getSupabase().auth.getUser(token);
    if (error || !data?.user) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('MediGuard auth verification error:', error);
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
}
