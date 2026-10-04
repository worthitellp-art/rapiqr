/**
 * Turns a client-supplied `?limit=` into a safe integer in [1, max].
 *
 * Several list endpoints used `parseInt(req.query.limit) || default` with no
 * ceiling, so `?limit=9999999` asked Mongo to materialise the whole collection
 * in one response. Non-numeric, zero and negative values fall back to `fallback`.
 */
function clampLimit(raw, { fallback = 100, max = 500 } = {}) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

module.exports = { clampLimit };
