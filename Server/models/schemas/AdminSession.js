/**
 * AdminSession Schema
 * Short-lived refresh-token store for the SUPER_ADMIN / ADMIN session.
 * Access tokens: 15-minute JWT (stateless).
 * Refresh tokens: 7-day rotating token stored here (server-side, httpOnly cookie).
 *
 * We store the SHA-256 hash of the raw refresh token — never the raw token itself.
 */
const { Schema, model } = require('mongoose');

const adminSessionSchema = new Schema(
  {
    user_id:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** SHA-256 hex of the raw refresh token delivered in the httpOnly cookie */
    token_hash:   { type: String, required: true, unique: true },
    /** IP that created this session — used in suspicious-IP detection */
    created_ip:   { type: String, default: null },
    user_agent:   { type: String, default: null },
    /** Sliding expiry — set to now + 7 days, updated on each rotation */
    expires_at:   { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    /** Marks a token that has been rotated (one-time-use guard) */
    revoked:      { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: { createdAt: 'created_at' } }
);

module.exports = model('AdminSession', adminSessionSchema);
