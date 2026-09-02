const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  full_name: { type: String, default: null },
  // Not unique — the app fuzzy-matches phone numbers by their last 10 digits
  // (see userModel.findByPhone), so a strict equality/uniqueness constraint
  // here would be wrong.
  phone_number: { type: String, default: null, index: true },
  avatar_url: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin', 'distributor'], default: 'user' },
  subscription_plan: { type: String, default: 'free' },
  is_subscribed: { type: Boolean, default: false },
  metadata: {
    phone_verified: { type: Boolean, default: false },
    phone_verified_at: { type: Date, default: null },
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, default: null },
      pendingSecret: { type: String, default: null },
    },
  },
  // select:false on every auth-secret field below — default .find()/.lean()
  // queries (used everywhere, including admin user search) can never leak them.
  password_hash: { type: String, default: null, select: false },
  google_id: { type: String, default: null, index: true, sparse: true },
  email_verified: { type: Boolean, default: false },
  password_reset_token: { type: String, default: null, select: false },
  password_reset_expires: { type: Date, default: null, select: false },
  created_at: { type: Date, default: Date.now },

  // Login/logout audit trail — never exposed via PUBLIC_FIELDS (IP/UA are not
  // for client consumption), read only through UserModel.getSecurityMeta for
  // suspicious-activity checks and admin review.
  last_login_at: { type: Date, default: null, select: false },
  last_login_ip: { type: String, default: null, select: false },
  last_login_user_agent: { type: String, default: null, select: false },
  login_count: { type: Number, default: 0, select: false },
  last_logout_at: { type: Date, default: null, select: false },
}, { versionKey: false });

module.exports = model('User', userSchema);
