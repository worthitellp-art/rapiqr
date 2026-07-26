import { supabase, isSupabaseConfigured } from './supabase';

export interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  subscriptionPlan?: string;
  isSubscribed?: boolean;
}

export const ADMIN_EMAIL = 'worthitellp@gmail.com';

/**
 * Fetch or auto-create profile for the logged in user.
 * Default role is ALWAYS 'user' for standard signups/logins.
 * Only designated admin credentials (worthitellp@gmail.com) get role = 'admin'.
 */
export async function getUserProfile(userId: string, email: string): Promise<UserProfileData | null> {
  const isDefaultAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const defaultRole: 'user' | 'admin' = isDefaultAdmin ? 'admin' : 'user';

  if (!isSupabaseConfigured) {
    return {
      id: userId,
      email,
      fullName: email.split('@')[0] || 'Admin',
      role: defaultRole,
      subscriptionPlan: isDefaultAdmin ? 'enterprise' : 'free',
      isSubscribed: isDefaultAdmin,
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, subscription_plan, is_subscribed')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name || email.split('@')[0],
        avatarUrl: data.avatar_url,
        role: (data.role as 'user' | 'admin') || defaultRole,
        subscriptionPlan: data.subscription_plan,
        isSubscribed: data.is_subscribed,
      };
    }

    // Always create profile with default role = 'user' (unless designated admin email)
    const newProfile: UserProfileData = {
      id: userId,
      email,
      fullName: email.split('@')[0] || 'User',
      role: defaultRole,
      subscriptionPlan: isDefaultAdmin ? 'enterprise' : 'free',
      isSubscribed: isDefaultAdmin,
    };

    await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: newProfile.fullName,
      role: newProfile.role,
      subscription_plan: newProfile.subscriptionPlan,
      is_subscribed: newProfile.isSubscribed,
    });

    return newProfile;
  } catch (err) {
    console.warn('Error fetching user profile from Supabase:', err);
    return {
      id: userId,
      email,
      fullName: email.split('@')[0] || 'User',
      role: defaultRole,
      subscriptionPlan: 'free',
      isSubscribed: false,
    };
  }
}
