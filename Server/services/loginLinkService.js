const crypto = require('crypto');
const ChatLoginLink = require('../models/schemas/ChatLoginLink');

// A link that has never been tapped stays valid this long, so an alert read
// late still works. Once tapped, it stays valid for the window below from that
// first tap, including after sign-out.
const UNOPENED_TTL_MS = 24 * 60 * 60 * 1000;
const OPENED_WINDOW_MS = 10 * 60 * 1000;

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Mints a chat login token for an owner. Returns the raw token (64 hex chars)
 * for the WhatsApp button; only its hash is stored.
 */
async function createChatLoginLink({ userId, sessionId }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await ChatLoginLink.create({
    token_hash: hashToken(rawToken),
    user_id: userId,
    session_id: String(sessionId),
    expires_at: new Date(Date.now() + UNOPENED_TTL_MS),
  });
  return rawToken;
}

/**
 * Checks a raw token. The first tap starts the 10-minute window atomically, so
 * two taps at once cannot both start it. Later taps inside the window succeed.
 * Returns `{ userId, sessionId }`, or null for an unknown, expired or malformed token.
 */
async function consumeChatLoginLink(rawToken) {
  if (!rawToken || !/^[a-f0-9]{64}$/.test(rawToken)) return null;
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  // First tap: start the window from now.
  let row = await ChatLoginLink.findOneAndUpdate(
    { token_hash: tokenHash, opened_at: null, expires_at: { $gt: now } },
    { $set: { opened_at: now, expires_at: new Date(now.getTime() + OPENED_WINDOW_MS) } },
    { returnDocument: 'after' }
  ).lean();

  // Later tap: still inside the window that started on the first tap.
  if (!row) {
    row = await ChatLoginLink.findOne({ token_hash: tokenHash, opened_at: { $ne: null }, expires_at: { $gt: now } }).lean();
  }
  if (!row) return null;
  return { userId: String(row.user_id), sessionId: row.session_id };
}

module.exports = { createChatLoginLink, consumeChatLoginLink, UNOPENED_TTL_MS, OPENED_WINDOW_MS };
