// Tracks failed sign-in attempts per identifier (email), independent of the
// per-IP rate limiter in middleware/rateLimiter.js — that one blunts a single
// IP hammering /signin, this one catches the same account being brute-forced
// from many IPs/proxies, which the IP limiter alone would miss.
const WINDOW_MS = 15 * 60 * 1000;
const SUSPICIOUS_THRESHOLD = 5;

const attempts = new Map();

function recordFailure(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    attempts.set(key, { start: now, count: 1 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

function clear(key) {
  attempts.delete(key);
}

module.exports = { recordFailure, clear, SUSPICIOUS_THRESHOLD };
