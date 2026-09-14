/**
 * In-memory one-time-code store for passwordless email login. Deliberately not
 * persisted — codes are short-lived (5 min) and single-use, so a server restart
 * just means the user requests a new one; no migration needed for this.
 *
 * Unlike phoneVerificationService, this has NO master bypass code: email OTP is
 * itself the primary login credential (not a secondary step behind an already-
 * authenticated session), so a hardcoded bypass here would be an account
 * takeover vector for every email address.
 */
const pending = new Map(); // normalizedEmail -> { code, expiresAt, attempts }

const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalize(email) {
  return String(email || '').trim().toLowerCase();
}

function createEmailOtp(email) {
  const key = normalize(email);
  const code = generateCode();
  pending.set(key, { code, expiresAt: Date.now() + TTL_MS, attempts: 0 });
  return code;
}

/**
 * @returns {{ ok: true } | { ok: false, reason: string, attemptsLeft?: number }}
 */
function verifyEmailOtp(email, code) {
  const key = normalize(email);
  const trimmed = String(code || '').trim();
  const entry = pending.get(key);

  if (!entry) return { ok: false, reason: 'no_pending_otp' };

  if (Date.now() > entry.expiresAt) {
    pending.delete(key);
    return { ok: false, reason: 'expired' };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    pending.delete(key);
    return { ok: false, reason: 'too_many_attempts' };
  }

  if (trimmed !== entry.code) {
    entry.attempts += 1;
    return { ok: false, reason: 'invalid_code', attemptsLeft: MAX_ATTEMPTS - entry.attempts };
  }

  pending.delete(key);
  return { ok: true };
}

module.exports = { createEmailOtp, verifyEmailOtp };
