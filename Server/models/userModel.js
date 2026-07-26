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
        .select('id, email, full_name, avatar_url, role, subscription_plan, is_subscribed')
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
        .select('id, email, full_name, avatar_url, role, subscription_plan, is_subscribed')
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
