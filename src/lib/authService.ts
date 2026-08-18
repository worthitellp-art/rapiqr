import { supabase, isSupabaseConfigured } from './supabase';

export interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  subscriptionPlan?: string;
  isSubscribed?: boolean;
  twoFactorEnabled?: boolean;
  isPhoneVerified?: boolean;
}

export const ADMIN_EMAIL = 'worthitellp@gmail.com';

/**
 * Fetch or auto-create profile for the logged in user.
 * Role is strictly derived from the database profile or designated admin identity.
 * Default role is ALWAYS 'user' for standard signups/logins.
 */
export async function getUserProfile(userId: string, email: string): Promise<UserProfileData | null> {
  const isDesignatedAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!isSupabaseConfigured) {
    return {
      id: userId,
      email,
      fullName: email.split('@')[0] || 'User',
      role: isDesignatedAdminEmail ? 'admin' : 'user',
      subscriptionPlan: isDesignatedAdminEmail ? 'enterprise' : 'free',
      isSubscribed: isDesignatedAdminEmail,
      isPhoneVerified: false,
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone_number, avatar_url, role, subscription_plan, is_subscribed, metadata')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // Role priority: designated admin email OR database profile role
      const authoritativeRole: 'user' | 'admin' = isDesignatedAdminEmail || data.role === 'admin' ? 'admin' : 'user';

      const hasPhone = Boolean(data.phone_number);
      const isVerified = Boolean(
        (data as any).metadata?.phone_verified ||
        (data as any).metadata?.phone_verified_at ||
        (hasPhone && (data as any).metadata?.phone_verified !== false)
      );

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name || email.split('@')[0],
        phoneNumber: data.phone_number || undefined,
        avatarUrl: data.avatar_url,
        role: authoritativeRole,
        subscriptionPlan: data.subscription_plan || (authoritativeRole === 'admin' ? 'enterprise' : 'free'),
        isSubscribed: data.is_subscribed ?? authoritativeRole === 'admin',
        twoFactorEnabled: Boolean((data as any).metadata?.twoFactor?.enabled),
        isPhoneVerified: isVerified && hasPhone,
      };
    }

    const defaultRole: 'user' | 'admin' = isDesignatedAdminEmail ? 'admin' : 'user';

    // Create new profile with authoritative role
    const newProfile: UserProfileData = {
      id: userId,
      email,
      fullName: email.split('@')[0] || 'User',
      role: defaultRole,
      subscriptionPlan: defaultRole === 'admin' ? 'enterprise' : 'free',
      isSubscribed: defaultRole === 'admin',
      isPhoneVerified: false,
    };

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: newProfile.fullName,
      role: newProfile.role,
      subscription_plan: newProfile.subscriptionPlan,
      is_subscribed: newProfile.isSubscribed,
    });
    // Not fatal: newProfile is still returned below so the UI proceeds either way,
    // but a swallowed RLS error here means the row never actually got created —
    // surfacing it makes that visible instead of failing silently on every reload.
    if (upsertError) console.warn('Failed to create profile row in Supabase:', upsertError.message);

    return newProfile;
  } catch (err) {
    console.warn('Error fetching user profile from Supabase:', err);
    const fallbackRole: 'user' | 'admin' = isDesignatedAdminEmail ? 'admin' : 'user';
    return {
      id: userId,
      email,
      fullName: email.split('@')[0] || 'User',
      role: fallbackRole,
      subscriptionPlan: fallbackRole === 'admin' ? 'enterprise' : 'free',
      isSubscribed: fallbackRole === 'admin',
      isPhoneVerified: false,
    };
  }
}

/**
 * Persist a phone number onto a user's profile — used both at signup (if provided)
 * and to auto-link the phone entered during sticker activation to the logged-in account,
 * so the Client Dashboard can match stickers to the account by phone number.
 */
export async function updateProfilePhoneNumber(userId: string, phoneNumber: string, isVerified = true): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { data: current } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .maybeSingle();

    const mergedMetadata = {
      ...(current?.metadata || {}),
      phone_verified: isVerified,
      phone_verified_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update({ phone_number: phoneNumber, metadata: mergedMetadata })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn(`updateProfilePhoneNumber (${userId}) Error:`, err);
    return false;
  }
}
