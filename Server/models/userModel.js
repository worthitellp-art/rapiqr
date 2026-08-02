const { supabaseAdmin } = require('../config/db');
const { ADMIN_EMAIL } = require('../middleware/authMiddleware');

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
   * Update the owner's own name / phone (used by Account Settings).
   */
  static async updateProfile(userId, updates) {
    try {
      const payload = {};
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.phoneNumber !== undefined) payload.phone_number = updates.phoneNumber;
      if (Object.keys(payload).length === 0) return this.findById(userId);

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, metadata')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('UserModel.updateProfile Error:', err);
      return null;
    }
  }

  /**
   * Shallow-merge new keys into profiles.metadata (used for 2FA state, etc).
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
        .single();

      if (error) throw error;
      return data;
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
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('UserModel.updateEmail Error:', err);
      return null;
    }
  }

  /**
   * Admin-only: list/search all profiles by name, email or phone (support console).
   */
  static async searchAll(query, limit = 200) {
    try {
      let q = supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      const term = String(query || '').trim().replace(/[,()]/g, '');
      if (term) {
        q = q.or(`email.ilike.%${term}%,full_name.ilike.%${term}%,phone_number.ilike.%${term}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
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

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('UserModel.upsertProfile Error:', err);
      return {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.fullName || profileData.email?.split('@')[0],
        role: profileData.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
        subscription_plan: 'free',
        is_subscribed: false
      };
    }
  }
}

module.exports = UserModel;
