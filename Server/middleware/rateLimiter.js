// Minimal in-memory fixed-window rate limiter — no external dependency needed
// for the handful of sensitive routes that need one (e.g. Twilio call-bridge).
function rateLimit({ windowMs, max, message }) {
  const hits = new Map();

  // Entries were only ever replaced when the same caller came back, so every
  // distinct IP/user left a permanent Map entry — unbounded growth under a
  // scan from many addresses. Sweep expired windows periodically; unref() so
  // the timer never keeps the process alive on its own.
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.start > windowMs) hits.delete(key);
    }
  }, Math.max(windowMs, 60 * 1000)).unref();

  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }

    if (entry.count >= max) {
      return res.status(429).json({ success: false, error: message || 'Too many requests, please try again later.' });
    }

    entry.count += 1;
    next();
  };
}

module.exports = { rateLimit };
