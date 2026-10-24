// Shared helper so every route returns the same shape for errors.
export function fail(res, error, fallback = 'Request failed') {
  console.error('MediGuard API error:', error);
  const rawMessage = error instanceof Error ? error.message : String(error || fallback);

  // Client validation or recognized domain errors that are safe to expose
  const isClientError = /required|must be|invalid|not found|not allowed|too long|cannot exceed|exceeded|please choose/i.test(rawMessage);
  const isDbOrInternal = /postgres|supabase|relation|syntax error|connection|select|insert|update|delete|column|foreign key|constraint|socket|econn/i.test(rawMessage);

  if (isDbOrInternal) {
    return res.status(500).json({ error: fallback });
  }

  const status = isClientError ? 400 : 500;
  const message = status === 400 ? rawMessage : fallback;
  return res.status(status).json({ error: message });
}
