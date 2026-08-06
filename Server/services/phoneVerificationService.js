/**
 * In-memory one-time-code store for verifying a user actually controls a phone
 * number before it's attached to their account. Deliberately not persisted —
 * codes are short-lived (5 min) and single-use, so a server restart just means
 * the user requests a new one; no migration needed for this.
 */
const pending = new Map(); // userId -> { phone, code, expiresAt, attempts }

const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createOtp(userId, phone) {
  const code = generateCode();
  pending.set(userId, { phone, code, expiresAt: Date.now() + TTL_MS, attempts: 0 });
  return code;
}

/**
 * @returns {{ ok: true, phone: string } | { ok: false, reason: string, attemptsLeft?: number }}
 */
function verifyOtp(userId, code) {
  const entry = pending.get(userId);
  if (!entry) return { ok: false, reason: 'no_pending_otp' };

  if (Date.now() > entry.expiresAt) {
    pending.delete(userId);
    return { ok: false, reason: 'expired' };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    pending.delete(userId);
    return { ok: false, reason: 'too_many_attempts' };
  }

  if (String(code || '').trim() !== entry.code) {
    entry.attempts += 1;
    return { ok: false, reason: 'invalid_code', attemptsLeft: MAX_ATTEMPTS - entry.attempts };
  }

  pending.delete(userId);
  return { ok: true, phone: entry.phone };
}

module.exports = { createOtp, verifyOtp };
