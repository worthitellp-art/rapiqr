const { supabaseAdmin } = require('../config/db');
const { ADMIN_EMAIL } = require('../middleware/authMiddleware');
const { normalizePhone, isSamePhone } = require('../utils/phone');

class UserModel {
  /**
   * Find profile by user ID
   */
  static async findById(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, metadata')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('UserModel.findById Error:', err);
      return null;
    }
  }

  /**
   * Return the profile row for a user, backfilling it from the Supabase Auth
   * record if it is missing.
   *
   * Accounts created while the server still wrote through the RLS-restricted anon
   * key got an auth.users row but no public.profiles row (13 of 17 accounts at the
   * time this was found). Those accounts can sign in — signIn() already self-heals —
   * but /auth/me hard-404'd "User profile not found" on every dashboard load, which
   * is what left the client dashboard unable to load at all.
   *
   * Returns null only when there is genuinely no auth.users row behind the id
   * (deleted account, or the synthetic admin id minted by adminSignIn).
   */
  static async ensureProfile(userId) {
    try {
      const existing = await this.findById(userId);
      if (existing) return this.reconcileAdminRole(existing);

      const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (error || !data?.user) return null;

      const authUser = data.user;
      const created = await this.upsertProfile({
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        phoneNumber: authUser.user_metadata?.phone_number || authUser.phone || undefined,
        avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || undefined,
      });
      return this.reconcileAdminRole(created);
    } catch (err) {
      console.error('UserModel.ensureProfile Error:', err);
      return null;
    }
  }

  /**
   * ADMIN_EMAIL is the authority on who is admin — the same rule verifyToken,
   * verifyAdmin and googleAuth already apply. This makes the stored row agree.
   *
   * Needed because a database trigger on auth.users inserts the profiles row itself,
   * hardcoded to role 'user' / plan 'free', and it runs before any of our code sees
   * the account. Signing in as the designated admin through a path that creates a
   * fresh auth user — Google OAuth in particular — therefore produced an admin-email
   * account stamped 'user', which lands in the client dashboard with no Fleet console.
   */
  static async reconcileAdminRole(profile) {
    if (!profile) return profile;
    const isDesignatedAdmin = profile.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (!isDesignatedAdmin || profile.role === 'admin') return profile;

    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin', subscription_plan: 'enterprise', is_subscribed: true })
        .eq('id', profile.id)
        .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, metadata')
        .maybeSingle();

      if (error) throw error;
      return data || profile;
    } catch (err) {
      console.error('UserModel.reconcileAdminRole Error:', err);
      return profile;
    }
  }

  /**
   * Find the account that already holds this phone number, if any.
   *
   * Compared in application code rather than with `.eq('phone_number', ...)` because
   * the column stores whatever shape the entry form produced — the same subscriber is
   * on file as "+91 9574713004" on one row and "+919574713004" on another, so an
   * equality filter reports "nobody has this number" and lets a second account take it.
   */
  static async findByPhone(phone, { excludeUserId } = {}) {
    if (!normalizePhone(phone)) return null;
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, metadata')
        .not('phone_number', 'is', null);

      if (error) throw error;
      return (data || []).find(
        (row) => row.id !== excludeUserId && isSamePhone(row.phone_number, phone)
      ) || null;
    } catch (err) {
      console.error('UserModel.findByPhone Error:', err);
      return null;
    }
  }

  /**
   * Find profile by Email
   */
  static async findByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, metadata')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('UserModel.findByEmail Error:', err);
      return null;
    }
  }

  /**
   * Find a Supabase Auth user by email.
   *
   * The admin API has no server-side email filter, so this pages through
   * listUsers. Only used on the first Google sign-in for a given address, not
   * on every request.
   */
  static async findAuthUserByEmail(email) {
    const target = String(email || '').trim().toLowerCase();
    if (!target) return null;

    const PER_PAGE = 200;
    try {
      for (let page = 1; page <= 25; page++) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
        if (error) throw error;

        const users = data?.users || [];
        const hit = users.find((u) => (u.email || '').toLowerCase() === target);
        if (hit) return hit;
        if (users.length < PER_PAGE) return null;
      }
      return null;
    } catch (err) {
      console.error('UserModel.findAuthUserByEmail Error:', err);
      return null;
    }
  }

  /**
   * The Supabase Auth UUID for an email, creating the auth user on first sight.
   *
   * Google identifies a user by `sub` — a 21-digit decimal string, NOT a UUID.
   * Writing it straight into profiles.id fails with
   * `invalid input syntax for type uuid` and 500s the whole Google sign-in,
   * which then leaves the client with no token and 401s every following call.
   *
   * Every other signup path mints its id through auth.admin.createUser, so this
   * does too: the account gets a real auth.users row, which is what
   * ensureProfile() and /auth/me already assume exists.
   */
  static async findOrCreateAuthUserId(email, { fullName, avatarUrl } = {}) {
    const targetEmail = String(email || '').trim().toLowerCase();
    if (!targetEmail) return null;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: targetEmail,
      email_confirm: true,
      user_metadata: { full_name: fullName, avatar_url: avatarUrl },
    });

    if (!error && data?.user?.id) return data.user.id;

    // Already registered — the same person signed up by email/password earlier,
    // or their profiles row was removed while auth.users kept theirs. Reuse that
    // account instead of failing the sign-in.
    const existing = await this.findAuthUserByEmail(targetEmail);
    if (existing?.id) return existing.id;

    console.error('UserModel.findOrCreateAuthUserId Error:', error);
    return null;
  }

  /**
   * Update the owner's own name / phone (used by Account Settings).
   * Uses maybeSingle and creates/upserts the profile row if it did not exist yet.
   */
  static async updateProfile(userId, updates) {
    const payload = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.phoneNumber !== undefined) payload.phone_number = updates.phoneNumber;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
    if (Object.keys(payload).length === 0) return this.findById(userId);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, metadata')
      .maybeSingle();

    if (error) {
      console.error('UserModel.updateProfile Error:', error);
      throw error;
    }

    if (data) return data;

    // Fallback: If no row was updated (profile row didn't exist in public.profiles yet),
    // fetch user identity from Supabase Auth and upsert.
    let email = null;
    let authName = null;
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authData?.user) {
        email = authData.user.email;
        authName = authData.user.user_metadata?.full_name;
      }
    } catch (authErr) {
      console.warn('UserModel.updateProfile: failed to fetch auth user', authErr);
    }

    return await this.upsertProfile({
      id: userId,
      email: email || `${userId}@user.local`,
      fullName: updates.fullName || authName || (email ? email.split('@')[0] : 'User'),
      phoneNumber: updates.phoneNumber
    });
  }

  /**
   * Shallow-merge new keys into profiles.metadata (used for 2FA state, phone verification, etc).
   */
  static async mergeMetadata(userId, patch) {
    try {
      const current = await this.findById(userId);
      const mergedMetadata = { ...(current?.metadata || {}), ...patch };

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ metadata: mergedMetadata })
        .eq('id', userId)
        .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, metadata')
        .maybeSingle();

      if (error) throw error;
      if (data) return data;

      // If no profile exists yet, upsert with merged metadata
      if (!current) {
        let email = null;
        try {
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (authData?.user) email = authData.user.email;
        } catch { /* ignore */ }

        return await this.upsertProfile({
          id: userId,
          email: email || `${userId}@user.local`,
          metadata: mergedMetadata
        });
      }
      return null;
    } catch (err) {
      console.error('UserModel.mergeMetadata Error:', err);
      return null;
    }
  }

  /**
   * Update the row's email (called after the Supabase Auth email has already changed).
   */
  static async updateEmail(userId, email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ email })
        .eq('id', userId)
        .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, metadata')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('UserModel.updateEmail Error:', err);
      return null;
    }
  }

  /**
   * Admin-only: list/search all users across database profiles and auth registry.
   */
  static async searchAll(query, limit = 1000) {
    try {
      // Fetch profile records
      let dbProfiles = [];
      try {
        const { data: profileRecords, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, created_at, metadata')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!profileError && Array.isArray(profileRecords)) {
          dbProfiles = profileRecords;
        }
      } catch (profileFetchError) {
        console.warn('UserModel.searchAll profiles fetch warning:', profileFetchError);
      }

      // Fetch registered auth users from Supabase Auth admin
      let authUserList = [];
      try {
        const { data: authUsersResult, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: limit
        });
        if (!authUsersError && authUsersResult?.users) {
          authUserList = authUsersResult.users;
        }
      } catch (authFetchError) {
        console.warn('UserModel.searchAll auth users fetch warning:', authFetchError);
      }

      // Map indexed by user ID
      const userRecordMap = new Map();

      // Seed map with profiles table entries
      for (const profile of dbProfiles) {
        if (profile?.id) {
          userRecordMap.set(profile.id, {
            id: profile.id,
            email: profile.email || '',
            full_name: profile.full_name || (profile.email ? profile.email.split('@')[0] : 'User'),
            phone_number: profile.phone_number || null,
            avatar_url: profile.avatar_url || null,
            role: profile.role || (profile.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'client'),
            subscription_plan: profile.subscription_plan || 'free',
            is_subscribed: Boolean(profile.is_subscribed),
            created_at: profile.created_at || new Date().toISOString(),
            metadata: profile.metadata || {},
          });
        }
      }

      // Merge auth user entries
      for (const authUser of authUserList) {
        const existingRecord = userRecordMap.get(authUser.id);
        const authFullName = authUser.user_metadata?.full_name;
        const authPhone = authUser.phone || authUser.user_metadata?.phone_number;

        if (existingRecord) {
          if (!existingRecord.email && authUser.email) {
            existingRecord.email = authUser.email;
          }
          if ((!existingRecord.full_name || existingRecord.full_name === 'User') && authFullName) {
            existingRecord.full_name = authFullName;
          }
          if (!existingRecord.phone_number && authPhone) {
            existingRecord.phone_number = authPhone;
          }
          if (!existingRecord.created_at && authUser.created_at) {
            existingRecord.created_at = authUser.created_at;
          }
          if (authUser.user_metadata && Object.keys(authUser.user_metadata).length > 0) {
            existingRecord.metadata = { ...authUser.user_metadata, ...(existingRecord.metadata || {}) };
          }
        } else {
          userRecordMap.set(authUser.id, {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authFullName || (authUser.email ? authUser.email.split('@')[0] : 'User'),
            phone_number: authPhone || null,
            avatar_url: null,
            role: authUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'client',
            subscription_plan: 'free',
            is_subscribed: false,
            created_at: authUser.created_at || new Date().toISOString(),
            metadata: authUser.user_metadata || {},
          });
        }
      }

      const allUsers = Array.from(userRecordMap.values());

      // Sort by creation date descending
      allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Filter by search query if provided
      const searchTerm = String(query || '').trim().toLowerCase();
      if (!searchTerm) {
        return allUsers;
      }

      return allUsers.filter((user) => {
        const emailMatch = user.email && user.email.toLowerCase().includes(searchTerm);
        const nameMatch = user.full_name && user.full_name.toLowerCase().includes(searchTerm);
        const phoneMatch = user.phone_number && user.phone_number.toLowerCase().includes(searchTerm);
        const idMatch = user.id && user.id.toLowerCase().includes(searchTerm);
        return emailMatch || nameMatch || phoneMatch || idMatch;
      });
    } catch (err) {
      console.error('UserModel.searchAll Error:', err);
      return [];
    }
  }

  /**
   * Upsert User Profile
   */
  static async upsertProfile(profileData) {
    try {
      const isDefaultAdmin = profileData.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const role = profileData.role || (isDefaultAdmin ? 'admin' : 'user');

      const payload = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.fullName || profileData.full_name || profileData.email?.split('@')[0],
        avatar_url: profileData.avatarUrl || profileData.avatar_url || null,
        role: role,
        subscription_plan: profileData.subscriptionPlan || (isDefaultAdmin ? 'enterprise' : 'free'),
        is_subscribed: profileData.isSubscribed ?? isDefaultAdmin
      };
      if (profileData.phoneNumber || profileData.phone_number) {
        payload.phone_number = profileData.phoneNumber || profileData.phone_number;
      }
      if (profileData.metadata) {
        payload.metadata = profileData.metadata;
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert(payload)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      // Never fabricate a profile here. Returning a synthetic in-memory row on a
      // failed write is what hid the anon-key/RLS breakage for weeks: signup
      // answered 200 with a token for an account that had no profiles row at all,
      // and the damage only surfaced later as /auth/me 404s and an empty dashboard.
      // Fail loudly at the point of the broken write instead.
      console.error('UserModel.upsertProfile Error:', err);
      throw err;
    }
  }
}

module.exports = UserModel;
