const crypto = require('crypto');
const ChatLoginLink = require('../models/schemas/ChatLoginLink');

const CHAT_LINK_TTL_MS = 10 * 60 * 1000; // 10 minutes, single use

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Mints a one-time chat login token for an owner. Returns the raw token (64 hex
 * chars) for the WhatsApp button; only its hash is stored.
 */
async function createChatLoginLink({ userId, sessionId }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await ChatLoginLink.create({
    token_hash: hashToken(rawToken),
    user_id: userId,
    session_id: String(sessionId),
    expires_at: new Date(Date.now() + CHAT_LINK_TTL_MS),
  });
  return rawToken;
}

/**
 * Consumes a raw token atomically. The update only matches a row that is still
 * unused and unexpired, so two taps at once can never both succeed. Returns
 * `{ userId, sessionId }` on success, or null for an unknown, used or expired token.
 */
async function consumeChatLoginLink(rawToken) {
  if (!rawToken || !/^[a-f0-9]{64}$/.test(rawToken)) return null;
  const row = await ChatLoginLink.findOneAndUpdate(
    { token_hash: hashToken(rawToken), used_at: null, expires_at: { $gt: new Date() } },
    { $set: { used_at: new Date() } },
    { new: true }
  ).lean();
  if (!row) return null;
  return { userId: String(row.user_id), sessionId: row.session_id };
}

module.exports = { createChatLoginLink, consumeChatLoginLink, CHAT_LINK_TTL_MS };
