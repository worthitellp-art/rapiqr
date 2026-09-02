const User = require('./schemas/User');
const { ADMIN_EMAIL } = require('../middleware/authMiddleware');
const { normalizePhone, isSamePhone } = require('../utils/phone');

const PUBLIC_FIELDS = 'email full_name phone_number avatar_url role subscription_plan is_subscribed metadata created_at';

function toApi(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    email: doc.email,
    full_name: doc.full_name,
    phone_number: doc.phone_number,
    avatar_url: doc.avatar_url,
    role: doc.role,
    subscription_plan: doc.subscription_plan,
    is_subscribed: doc.is_subscribed,
    metadata: doc.metadata || {},
    created_at: doc.created_at,
  };
}

class UserModel {
  /**
   * Find profile by user ID
   */
  static async findById(userId) {
    try {
      if (!userId) return null;
      const doc = await User.findById(userId).select(PUBLIC_FIELDS).lean();
      return toApi(doc);
    } catch (err) {
      console.error('UserModel.findById Error:', err);
      return null;
    }
  }

  /**
   * Return the profile for a user. Kept as its own entry point (rather than
   * inlining findById everywhere) because callers historically expect a
   * self-healing lookup here — now that `users` is a single self-contained
   * collection there is nothing left to backfill, so this is a thin wrapper
   * that also reconciles the designated-admin role.
   */
  static async ensureProfile(userId) {
    const existing = await this.findById(userId);
    if (!existing) return null;
    return this.reconcileAdminRole(existing);
  }

  /**
   * ADMIN_EMAIL is the authority on who is admin — the same rule verifyToken,
   * verifyAdmin and googleAuth already apply. This makes the stored row agree.
   */
  static async reconcileAdminRole(profile) {
    if (!profile) return profile;
    const isDesignatedAdmin = profile.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (!isDesignatedAdmin || profile.role === 'admin') return profile;

    try {
      const doc = await User.findByIdAndUpdate(
        profile.id,
        { $set: { role: 'admin', subscription_plan: 'enterprise', is_subscribed: true } },
        { new: true }
      ).select(PUBLIC_FIELDS).lean();
      return toApi(doc) || profile;
    } catch (err) {
      console.error('UserModel.reconcileAdminRole Error:', err);
      return profile;
    }
  }

  /**
   * Find the account that already holds this phone number, if any.
   *
   * Compared in application code rather than with an equality filter because
   * the field stores whatever shape the entry form produced — the same
   * subscriber is on file as "+91 9574713004" on one row and "+919574713004"
   * on another, so an equality filter reports "nobody has this number" and
   * lets a second account take it.
   */
  static async findByPhone(phone, { excludeUserId } = {}) {
    if (!normalizePhone(phone)) return null;
    try {
      const docs = await User.find({ phone_number: { $ne: null } }).select(PUBLIC_FIELDS).lean();
      const hit = docs.find(
        (row) => String(row._id) !== String(excludeUserId) && isSamePhone(row.phone_number, phone)
      );
      return hit ? toApi(hit) : null;
    } catch (err) {
      console.error('UserModel.findByPhone Error:', err);
      return null;
    }
  }

  /**
   * Find profile by email
   */
  static async findByEmail(email) {
    try {
      if (!email) return null;
      const doc = await User.findOne({ email: String(email).trim().toLowerCase() }).select(PUBLIC_FIELDS).lean();
      return toApi(doc);
    } catch (err) {
      console.error('UserModel.findByEmail Error:', err);
      return null;
    }
  }

  /**
   * Update the owner's own name / avatar (used by Account Settings). Phone
   * numbers are never set through here — see authController.updateProfile.
   */
  static async updateProfile(userId, updates) {
    const payload = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.phoneNumber !== undefined) payload.phone_number = updates.phoneNumber;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
    if (Object.keys(payload).length === 0) return this.findById(userId);

    try {
      const doc = await User.findByIdAndUpdate(userId, { $set: payload }, { new: true })
        .select(PUBLIC_FIELDS)
        .lean();
      return toApi(doc);
    } catch (err) {
      console.error('UserModel.updateProfile Error:', err);
      throw err;
    }
  }

  /**
   * Shallow-merge new keys into metadata (used for 2FA state, phone verification, etc).
   */
  static async mergeMetadata(userId, patch) {
    try {
      const current = await User.findById(userId).select('metadata').lean();
      if (!current) return null;
      const mergedMetadata = { ...(current.metadata || {}), ...patch };

      const doc = await User.findByIdAndUpdate(userId, { $set: { metadata: mergedMetadata } }, { new: true })
        .select(PUBLIC_FIELDS)
        .lean();
      return toApi(doc);
    } catch (err) {
      console.error('UserModel.mergeMetadata Error:', err);
      return null;
    }
  }

  /**
   * Update the account's email (unique index throws E11000 on collision —
   * left for the caller to catch and translate to a 409).
   */
  static async updateEmail(userId, email) {
    const doc = await User.findByIdAndUpdate(
      userId,
      { $set: { email: String(email).trim().toLowerCase() } },
      { new: true }
    ).select(PUBLIC_FIELDS).lean();
    return toApi(doc);
  }

  /**
   * Auth-only lookup: includes password_hash (select:false on the schema
   * hides it from every other caller). Never forward the returned document
   * to an API response — extract fields through toApi/findById instead.
   */
  static async findAuthByEmail(email) {
    if (!email) return null;
    return User.findOne({ email: String(email).trim().toLowerCase() }).select('+password_hash');
  }

  static async findAuthById(userId) {
    if (!userId) return null;
    try {
      return await User.findById(userId).select('+password_hash');
    } catch (err) {
      console.error('UserModel.findAuthById Error:', err);
      return null;
    }
  }

  /**
   * Create a new local account. The profile document IS the auth record now
   * (no separate auth.users table), so this is the only place a user is minted.
   */
  static async createUser({ email, passwordHash = null, fullName = null, phoneNumber = null, googleId = null, role = 'user', emailVerified = false }) {
    const doc = await User.create({
      email: String(email).trim().toLowerCase(),
      password_hash: passwordHash,
      full_name: fullName || null,
      phone_number: phoneNumber || null,
      google_id: googleId,
      role,
      email_verified: emailVerified,
    });
    return toApi(doc);
  }

  /**
   * Change the account's password hash. Also clears any outstanding reset
   * token so a used/superseded token can never be replayed.
   */
  static async setPasswordHash(userId, passwordHash) {
    await User.findByIdAndUpdate(userId, {
      $set: { password_hash: passwordHash, password_reset_token: null, password_reset_expires: null },
    });
  }

  /**
   * Login/logout audit fields (last_login_ip etc.) are select:false — this is
   * the one place they're read, for new-device detection and admin review.
   */
  static async getSecurityMeta(userId) {
    try {
      if (!userId) return null;
      return await User.findById(userId)
        .select('last_login_at last_login_ip last_login_user_agent login_count last_logout_at')
        .lean();
    } catch (err) {
      console.error('UserModel.getSecurityMeta Error:', err);
      return null;
    }
  }

  /**
   * Stamp a successful sign-in. Called after authentication succeeds (password,
   * admin, or Google) so last_login_ip always reflects the most recent proven
   * login, which is what new-device detection compares the next attempt against.
   */
  static async recordLogin(userId, { ip, userAgent } = {}) {
    try {
      await User.findByIdAndUpdate(userId, {
        $set: { last_login_at: new Date(), last_login_ip: ip || null, last_login_user_agent: userAgent || null },
        $inc: { login_count: 1 },
      });
    } catch (err) {
      console.error('UserModel.recordLogin Error:', err);
    }
  }

  static async recordLogout(userId) {
    try {
      await User.findByIdAndUpdate(userId, { $set: { last_logout_at: new Date() } });
    } catch (err) {
      console.error('UserModel.recordLogout Error:', err);
    }
  }

  /**
   * Admin-only: list/search all users.
   */
  static async searchAll(query, limit = 1000) {
    try {
      const filter = {};
      const searchTerm = String(query || '').trim();
      if (searchTerm) {
        const rx = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ email: rx }, { full_name: rx }, { phone_number: rx }];
      }

      const docs = await User.find(filter)
        .select(PUBLIC_FIELDS)
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      return docs.map(toApi);
    } catch (err) {
      console.error('UserModel.searchAll Error:', err);
      return [];
    }
  }
}

module.exports = UserModel;
