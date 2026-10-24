const requestCounts = new Map();

// Periodic prune every 60s
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime) {
        requestCounts.delete(key);
      }
    }
  }, 60000);
  if (timer.unref) timer.unref();
}

export function checkRateLimit(key, maxRequests = 20, windowMs = 60000) {
  const now = Date.now();
  let record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    requestCounts.set(key, record);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  record.count += 1;
  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  return { allowed: true, remaining: maxRequests - record.count };
}
