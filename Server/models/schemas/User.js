const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  full_name: { type: String, default: null },
  // Not unique — the app fuzzy-matches phone numbers by their last 10 digits
  // (see userModel.findByPhone), so a strict equality/uniqueness constraint
  // here would be wrong.
  phone_number: { type: String, default: null, index: true },
  avatar_url: { type: String, default: null },
  /**
   * Legacy role field kept for backward compat with existing middleware.
   * RBAC role_name is the authoritative field for the new permission system.
   */
  role: { type: String, enum: ['user', 'admin', 'distributor', 'super_admin', 'manager'], default: 'user' },
  /** Canonical RBAC role name — matches Role.name (SUPER_ADMIN | ADMIN | MANAGER | USER) */
  role_name: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'], default: 'USER', index: true },
  /** Per-user permission overrides (additive on top of the role's default set) */
  extra_permissions: { type: [String], default: [] },
  metadata: {
    phone_verified: { type: Boolean, default: false },
    phone_verified_at: { type: Date, default: null },
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, default: null },
      pendingSecret: { type: String, default: null },
      /** bcrypt-hashed backup codes — revealed only once at MFA setup */
      backup_codes: { type: [String], default: [], select: false },
      backup_codes_remaining: { type: Number, default: 0 },
    },
  },
  /**
   * Forces a password change on next login (set to true by seed script).
   * Login endpoint returns { mustChangePassword: true } instead of a session.
   */
  must_change_password: { type: Boolean, default: false },
  /** Account lockout after repeated failed logins */
  locked_until: { type: Date, default: null, select: false },
  failed_login_count: { type: Number, default: 0, select: false },
  /** Optional per-user IP allowlist for the admin panel (SUPER_ADMIN only) */
  ip_allowlist: { type: [String], default: [], select: false },
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

  // DPDP Act §14 nomination — lets this account holder name someone else to
  // exercise their data-principal rights in the event of death/incapacity.
  // Optional; a single nominee is enough for this product's scope.
  nominee: {
    name: { type: String, default: null },
    relationship: { type: String, default: null },
    contact_phone: { type: String, default: null },
    contact_email: { type: String, default: null },
    set_at: { type: Date, default: null },
  },
}, { versionKey: false });

module.exports = model('User', userSchema);
