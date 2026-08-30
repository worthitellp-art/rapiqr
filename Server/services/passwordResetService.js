const crypto = require('crypto');
const User = require('../models/schemas/User');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a password-reset link for a user, storing only the SHA-256 hash
 * of the token (never the raw token) so a database read alone can't be used
 * to reset the account. Used by both the self-service forgot-password flow
 * and the admin-triggered reset.
 */
async function createResetLink(user) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await User.findByIdAndUpdate(user.id || user._id, {
    $set: {
      password_reset_token: hashToken(rawToken),
      password_reset_expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  return `${frontendUrl}/reset-password?token=${rawToken}`;
}

/**
 * Consumes a raw reset token: looks up the user by its hash and expiry,
 * returning the user document if valid or null otherwise. Does not clear
 * the token — the caller clears it once the new password is actually saved.
 */
async function findUserByResetToken(rawToken) {
  if (!rawToken) return null;
  return User.findOne({
    password_reset_token: hashToken(rawToken),
    password_reset_expires: { $gt: new Date() },
  }).select('+password_hash +password_reset_token +password_reset_expires');
}

module.exports = { createResetLink, findUserByResetToken };
