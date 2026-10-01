/**
 * Central privacy/retention configuration (DPDP Rules 2025, Rule 8 — data to be
 * retained only as long as necessary for the specified purpose).
 *
 * These are OPERATIONAL defaults, not asserted legal minimums/maximums — the
 * DPDP Act/Rules do not prescribe a fixed retention period for most of these
 * categories (unlike the CERT-In-driven 180-day floor already used for
 * AuditLog). Each REVIEW_REQUIRED note below means: this number is a business
 * call, confirm it before relying on it in a compliance representation.
 *
 * Every value is overridable via env var so a retention change doesn't need a
 * code deploy. NOTE: changing a *_RETENTION_DAYS value only affects newly
 * created MongoDB TTL indexes — an index that already exists in a running
 * database keeps its original expireAfterSeconds until it is dropped/recreated
 * (e.g. via `collMod`), so a production retention-period change needs a
 * migration step, not just an env var edit.
 */

function days(envVar, fallbackDays) {
  const raw = process.env[envVar];
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackDays;
}

const SECONDS_PER_DAY = 86400;

const RETENTION = {
  // Visitor-submitted emergency/help reports (message, reporter phone, GPS).
  // REVIEW_REQUIRED: default chosen as "long enough to resolve a dispute or
  // support request, short enough not to become an indefinite location log."
  ALERT_RETENTION_DAYS: days('ALERT_RETENTION_DAYS', 365),

  // RepiChat messages between a visitor and an owner (may include images).
  // REVIEW_REQUIRED default, same reasoning as Alert.
  CHAT_MESSAGE_RETENTION_DAYS: days('CHAT_MESSAGE_RETENTION_DAYS', 365),

  // Chat session metadata (customer_name, pseudonymous token, last-message
  // preview). Kept as long as its messages for now — CASCADE-adjacent to
  // ChatMessage, not a separate business call.
  CHAT_SESSION_RETENTION_DAYS: days('CHAT_SESSION_RETENTION_DAYS', 365),

  // Security/audit trail — CERT-In directions cite a 180-day floor; this
  // mirrors the existing AuditLog index (kept here too so every retention
  // period is discoverable in one place, per task §45).
  AUDIT_LOG_RETENTION_DAYS: days('AUDIT_LOG_RETENTION_DAYS', 180),

  // Operational server logs (errors/warnings/security events only — see
  // loggerMiddleware.shouldPersistToDatabase).
  SERVER_LOG_RETENTION_DAYS: days('SERVER_LOG_RETENTION_DAYS', 30),
};

function toExpireAfterSeconds(daysValue) {
  return daysValue * SECONDS_PER_DAY;
}

module.exports = { RETENTION, toExpireAfterSeconds };
