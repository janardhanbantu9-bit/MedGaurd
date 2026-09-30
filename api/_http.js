// Shared helper so every route returns the same shape for errors.
export function fail(res, error, fallback = 'Request failed') {
  const message = error instanceof Error ? error.message : fallback;
  const status = /required|configured/i.test(message) ? (/configured/i.test(message) ? 500 : 400) : 500;
  console.error('MediGuard API error:', error);
  return res.status(status).json({ error: message });
}
