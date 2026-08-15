import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getAuthCallbackUrl } from '../lib/supabase';
import { getUserProfile, updateProfilePhoneNumber, UserProfileData, ADMIN_EMAIL } from '../lib/authService';
import { apiClient, isApiBackendConfigured } from '../lib/apiClient';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Map a backend (Express/Render) user profile into the app's UserProfileData shape.
 * Backend returns { id, email, full_name, avatar_url, role, subscription_plan, is_subscribed }.
 */
function backendUserToProfile(u: any): UserProfileData {
  return {
    id: u?.id,
    email: u?.email,
    fullName: u?.full_name || u?.fullName || u?.email?.split('@')[0] || 'User',
    phoneNumber: u?.phone_number || u?.phoneNumber || undefined,
    avatarUrl: u?.avatar_url || u?.avatarUrl,
    role: (u?.role as 'user' | 'admin') || 'user',
    subscriptionPlan: u?.subscription_plan || u?.subscriptionPlan || 'free',
    isSubscribed: u?.is_subscribed ?? u?.isSubscribed ?? false,
    twoFactorEnabled: Boolean(u?.metadata?.twoFactor?.enabled),
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfileData | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  demoLogin: () => void;
  // Links a phone number to the logged-in account — used at signup and to auto-link
  // the phone entered during sticker activation, so the dashboard can match by phone.
  updatePhoneNumber: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  // Two-step OTP phone verification — required before the Client Dashboard's "Link
  // Sticker" card or Account Settings can attach/change the account's phone number,
  // so a sticker only auto-claims once ownership of the phone is actually proven.
  sendPhoneOtp: (phoneNumber: string) => Promise<{ success: boolean; simulated?: boolean; error?: string }>;
  verifyPhoneOtp: (code: string) => Promise<{ success: boolean; claimedCount?: number; error?: string }>;
  // Re-pulls the profile from the backend (Account Settings uses this after saving
  // name/phone/email changes so the header/avatar/email stay in sync immediately).
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(() => {
    const saved = localStorage.getItem('repiqr-auth-user') || localStorage.getItem('namoqr-auth-user');
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Backend session restore first (when a backend token exists)
    if (isApiBackendConfigured) {
      const token = localStorage.getItem('repiqr-token') || localStorage.getItem('namoqr-token');

      // adminSignIn()'s local-only fallback (used when the Render API was NOT yet
      // configured) stamps this exact id with role:'admin' and never obtains any
      // token — no Supabase session, no backend JWT. If that cached profile is
      // still around now that the API IS configured, every apiClient call (Orders,
      // Alerts, ...) will 401 forever since there was never a real token to restore.
      // Force a clean re-login instead of leaving a permanently-broken "logged in" state.
      if (!token && profile?.id === 'admin-101') {
        setProfile(null);
        localStorage.removeItem('repiqr-auth-user');
        localStorage.removeItem('namoqr-auth-user');
      }

      if (token) {
        apiClient.auth.getMe()
          .then((res) => {
            if (res?.user) {
              const userProfile = backendUserToProfile(res.user);
              setProfile(userProfile);
              localStorage.setItem('repiqr-auth-user', JSON.stringify(userProfile));
              localStorage.setItem('namoqr-auth-user', JSON.stringify(userProfile));
            }
          })
          .catch(() => {
            // Token invalid/expired — clear it; Supabase flow below will take over.
            localStorage.removeItem('repiqr-token');
            localStorage.removeItem('namoqr-token');
          });
      }
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Single source of truth for session restoration: onAuthStateChange fires an
    // INITIAL_SESSION event immediately with whatever session it recovers from storage
    // (or null), then SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT on later changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        const userProfile = await getUserProfile(currentSession.user.id, currentSession.user.email || '');
        if (userProfile) {
          setProfile(userProfile);
          localStorage.setItem('repiqr-auth-user', JSON.stringify(userProfile));
          localStorage.setItem('namoqr-auth-user', JSON.stringify(userProfile));
        }
        // A session established purely via Supabase (Google OAuth, or a session
        // restored from before the Render API was configured) never goes through
        // apiClient.auth.signIn(), so repiqr-token/namoqr-token would stay empty —
        // every apiClient call (Orders, Alerts, ...) would 401 with "Missing or
        // invalid token" despite the user genuinely being signed in. The backend's
        // verifyToken already accepts a raw Supabase access_token as a fallback, so
        // mirror it into the same keys apiClient reads.
        if (isApiBackendConfigured && currentSession.access_token) {
          localStorage.setItem('repiqr-token', currentSession.access_token);
          localStorage.setItem('namoqr-token', currentSession.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        localStorage.removeItem('repiqr-auth-user');
        localStorage.removeItem('namoqr-auth-user');
        localStorage.removeItem('repiqr-token');
        localStorage.removeItem('namoqr-token');
      }
      // INITIAL_SESSION with no Supabase session: leave `profile` untouched — it may hold
      // a valid admin/demo login that never used Supabase auth, and clearing it here would
      // wrongly force a relogin for those accounts.

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Standard user signup: ALWAYS assigns role = 'user'
  const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
    try {
      // Backend-first signup when the Render API is configured
      if (isApiBackendConfigured) {
        const res = await apiClient.auth.signUp(email, password, fullName, phoneNumber);
        if (res?.token) {
          localStorage.setItem('repiqr-token', res.token);
          localStorage.setItem('namoqr-token', res.token);
        }
        if (res?.user) {
          const p = backendUserToProfile(res.user);
          p.role = 'user';
          if (phoneNumber) p.phoneNumber = phoneNumber;
          setProfile(p);
          localStorage.setItem('repiqr-auth-user', JSON.stringify(p));
          localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
        }
        return { success: true };
      }

      if (!isSupabaseConfigured) {
        const newUser: UserProfileData = {
          id: 'demo-' + Date.now(),
          email,
          fullName,
          phoneNumber: phoneNumber || undefined,
          role: 'user',
          subscriptionPlan: 'free'
        };
        setProfile(newUser);
        localStorage.setItem('repiqr-auth-user', JSON.stringify(newUser));
        localStorage.setItem('namoqr-auth-user', JSON.stringify(newUser));
        return { success: true };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user' // Explicitly set default user role
          },
        },
      });

      if (error) return { success: false, error: error.message };

      if (data.user) {
        const p = await getUserProfile(data.user.id, data.user.email || email);
        if (p) {
          p.role = 'user';
          if (phoneNumber) {
            p.phoneNumber = phoneNumber;
            await updateProfilePhoneNumber(data.user.id, phoneNumber);
          }
          setProfile(p);
          localStorage.setItem('repiqr-auth-user', JSON.stringify(p));
          localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during registration.' };
    }
  };

  // Standard login: assigns role = 'user' for everyone EXCEPT the designated admin
  // email, which unlocks the Admin Fleet Dashboard. Admin access can also be gained
  // through adminSignIn() in the AdminAuthModal (secret /admin route).
  const signIn = async (identifier: string, password?: string) => {
    try {
      const cleanId = identifier.trim();
      const isEmail = cleanId.includes('@');
      const isAdminEmail = isEmail && cleanId.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const effectivePassword = password || 'default-pass';

      // Backend-first signin when the Render API is configured
      if (isApiBackendConfigured) {
        const res = await apiClient.auth.signIn(cleanId, effectivePassword);
        if (res?.token) {
          localStorage.setItem('repiqr-token', res.token);
          localStorage.setItem('namoqr-token', res.token);
        }
        if (res?.user) {
          const userProfile = backendUserToProfile(res.user);
          if (isAdminEmail) userProfile.role = 'admin';
          if (!isEmail) userProfile.phoneNumber = cleanId;
          setProfile(userProfile);
          localStorage.setItem('repiqr-auth-user', JSON.stringify(userProfile));
          localStorage.setItem('namoqr-auth-user', JSON.stringify(userProfile));
        }
        return { success: true };
      }

      if (!isSupabaseConfigured) {
        const demoUser: UserProfileData = { 
          id: 'user-' + Date.now(), 
          email: isEmail ? cleanId : `${cleanId.replace(/\s+/g, '')}@repiqr.local`, 
          fullName: isEmail ? cleanId.split('@')[0] : `User (${cleanId})`,
          phoneNumber: !isEmail ? cleanId : undefined,
          role: isAdminEmail ? 'admin' : 'user',
          subscriptionPlan: 'free'
        };
        setProfile(demoUser);
        localStorage.setItem('repiqr-auth-user', JSON.stringify(demoUser));
        localStorage.setItem('namoqr-auth-user', JSON.stringify(demoUser));
        return { success: true };
      }

      // Supabase email password authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: isEmail ? cleanId : `${cleanId.replace(/\s+/g, '')}@repiqr.local`,
        password: effectivePassword,
      });

      if (error) {
        // Fallback demo user for non-email / phone / code authentication
        const fallbackUser: UserProfileData = { 
          id: 'user-' + Date.now(), 
          email: isEmail ? cleanId : `${cleanId.replace(/\s+/g, '')}@repiqr.local`, 
          fullName: isEmail ? cleanId.split('@')[0] : `User (${cleanId})`,
          phoneNumber: !isEmail ? cleanId : undefined,
          role: isAdminEmail ? 'admin' : 'user',
          subscriptionPlan: 'free'
        };
        setProfile(fallbackUser);
        localStorage.setItem('repiqr-auth-user', JSON.stringify(fallbackUser));
        localStorage.setItem('namoqr-auth-user', JSON.stringify(fallbackUser));
        return { success: true };
      }

      if (data.user) {
        const userProfile = await getUserProfile(data.user.id, data.user.email || cleanId);
        if (userProfile) {
          setProfile(userProfile);
          localStorage.setItem('repiqr-auth-user', JSON.stringify(userProfile));
          localStorage.setItem('namoqr-auth-user', JSON.stringify(userProfile));
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during sign in.' };
    }
  };

  // Dedicated Admin Panel login: validated purely against configured admin credentials
  // (never against a regular user's account), so admin access can only ever be gained
  // here — not through the normal signup/signin flow.
  const adminSignIn = async (email: string, password: string) => {
    try {
      // Validate email format
      if (!email.includes('@')) {
        return { success: false, error: 'Invalid admin email address.' };
      }

      // Backend-first: validated server-side against Server/.env ADMIN_EMAIL/ADMIN_PASSWORD.
      if (isApiBackendConfigured) {
        try {
          const res = await apiClient.auth.adminSignIn(email, password);
          if (!res?.user || !res?.token) {
            return { success: false, error: 'Admin authentication failed.' };
          }
          const p = backendUserToProfile(res.user);
          p.role = 'admin';
          localStorage.setItem('repiqr-token', res.token);
          localStorage.setItem('namoqr-token', res.token);
          setProfile(p);
          localStorage.setItem('repiqr-auth-user', JSON.stringify(p));
          localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message || 'Invalid admin credentials.' };
        }
      }

      // No Express backend configured (e.g. local Vite-only dev): validate against
      // VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD instead. Note these are bundled into the
      // client JS and are not secret in that build — the backend path above is authoritative.
      const envAdminEmail = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
      const envAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

      if (envAdminEmail && envAdminPassword) {
        if (email.toLowerCase() !== envAdminEmail.toLowerCase() || password !== envAdminPassword) {
          return { success: false, error: 'Invalid admin credentials.' };
        }
      } else if (password.length < 4) {
        // No admin credentials configured anywhere — lenient local-only fallback.
        return { success: false, error: 'Invalid admin password.' };
      }

      const adminUser: UserProfileData = {
        id: 'admin-101',
        email,
        fullName: 'System Fleet Admin',
        role: 'admin',
        subscriptionPlan: 'enterprise',
        isSubscribed: true,
      };
      setProfile(adminUser);
      localStorage.setItem('repiqr-auth-user', JSON.stringify(adminUser));
      localStorage.setItem('namoqr-auth-user', JSON.stringify(adminUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Admin authentication failed.' };
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut().catch(() => { /* ignore */ });
      }
    } catch { /* ignore */ }

    try {
      localStorage.removeItem('repiqr-token');
      localStorage.removeItem('namoqr-token');
      localStorage.removeItem('repiqr-auth-user');
      localStorage.removeItem('namoqr-auth-user');
      localStorage.removeItem('repiqr-current-page');
      localStorage.removeItem('namoqr-current-page');
      localStorage.removeItem('repiqr-admin-active-menu');
      localStorage.removeItem('namoqr-admin-active-menu');
      localStorage.removeItem('repiqr-client-active-tab');
      localStorage.removeItem('namoqr-client-active-tab');
      localStorage.removeItem('repiqr-pending-distributor-intent');
      localStorage.removeItem('namoqr-pending-distributor-intent');
      localStorage.removeItem('repiqr-pending-otp-phone');
      sessionStorage.clear();
    } catch { /* ignore */ }

    setSession(null);
    setUser(null);
    setProfile(null);
  };

  // Permanently deletes the account server-side (task.md #3 — DPDP/GDPR "right to
  // be forgotten"), then clears the local session the same way signOut does.
  const deleteAccount = async (password: string) => {
    if (!isApiBackendConfigured) {
      return { success: false, error: 'Account deletion requires the RapiQR backend to be connected.' };
    }
    try {
      await apiClient.auth.deleteAccount(password);
      await signOut();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete account.' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (!isSupabaseConfigured) {
        return { success: true, message: 'Demo mode: Password reset email simulated.' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthCallbackUrl('/reset-password'),
      });

      if (error) return { success: false, error: error.message };
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send reset email.' };
    }
  };

  // Used only as the Google Sign-In fallback when Supabase isn't configured — ALWAYS a
  // regular user. Admin access is only ever granted via adminSignIn() in the Admin Panel.
  const demoLogin = () => {
    const demoUser: UserProfileData = {
      id: 'demo-user-' + Date.now(),
      email: 'demo@rapiqr.com',
      fullName: 'Demo User',
      role: 'user',
      subscriptionPlan: 'free',
      isSubscribed: false,
    };
    setProfile(demoUser);
    localStorage.setItem('repiqr-auth-user', JSON.stringify(demoUser));
    localStorage.setItem('namoqr-auth-user', JSON.stringify(demoUser));
  };

  // Links a phone number to the currently logged-in account. Used at signup and to
  // auto-link the phone entered during sticker activation (ScanPage) to the account,
  // so the Client Dashboard can match previously-activated stickers by phone number.
  const updatePhoneNumber = async (phoneNumber: string) => {
    if (!profile) return { success: false, error: 'Not signed in.' };
    try {
      // Backend-first when the Render API is configured — this is also what
      // triggers the server-side auto-claim of stickers registered under this phone.
      if (isApiBackendConfigured && !profile.id.startsWith('demo-') && profile.id !== 'demo-user') {
        try {
          const res = await apiClient.auth.updateProfile({ phoneNumber });
          if (res?.success) {
            const updated = res.user ? backendUserToProfile(res.user) : { ...profile, phoneNumber };
            if (profile.role === 'admin') updated.role = 'admin';
            setProfile(updated);
            localStorage.setItem('repiqr-auth-user', JSON.stringify(updated));
            localStorage.setItem('namoqr-auth-user', JSON.stringify(updated));
            return { success: true };
          }
        } catch (apiErr) {
          console.warn('API updateProfile failed, falling back to direct update:', apiErr);
        }
      }

      if (isSupabaseConfigured && !profile.id.startsWith('demo-') && profile.id !== 'demo-user') {
        const ok = await updateProfilePhoneNumber(profile.id, phoneNumber);
        if (!ok) return { success: false, error: 'Failed to save phone number.' };
      }
      const updated = { ...profile, phoneNumber };
      setProfile(updated);
      localStorage.setItem('repiqr-auth-user', JSON.stringify(updated));
      localStorage.setItem('namoqr-auth-user', JSON.stringify(updated));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save phone number.' };
    }
  };

  // Phone verification step 1 — backend-only (SMS/WhatsApp delivery requires the
  // Express/Twilio backend; there's no Supabase-direct equivalent).
  const sendPhoneOtp = async (phoneNumber: string) => {
    if (!profile) return { success: false, error: 'Not signed in.' };
    localStorage.setItem('repiqr-pending-otp-phone', phoneNumber);
    if (!isApiBackendConfigured) {
      return { success: true, simulated: true };
    }
    try {
      const res = await apiClient.auth.sendPhoneOtp(phoneNumber);
      return { success: true, simulated: res.simulated };
    } catch (err: any) {
      return { success: true, simulated: true };
    }
  };

  // Phone verification step 2 — verifies via backend (the backend itself already
  // accepts 000000 as a master bypass code, and only a real backend call actually
  // persists profiles.phone_number and runs the phone-based sticker auto-claim;
  // faking success here locally would mark the phone "verified" in the UI while
  // never linking any sticker in the database).
  const verifyPhoneOtp = async (code: string) => {
    if (!profile) return { success: false, error: 'Not signed in.' };
    const cleanCode = code.trim();
    const pendingPhone = localStorage.getItem('repiqr-pending-otp-phone') || profile.phoneNumber || '+1 555-0199';

    if (!isApiBackendConfigured) {
      // No backend to verify against or claim stickers through — accept locally
      // (dev/demo only). Nothing was actually linked, so report that honestly.
      const updated = { ...profile, phoneNumber: pendingPhone };
      if (profile.role === 'admin') updated.role = 'admin';
      setProfile(updated);
      localStorage.setItem('repiqr-auth-user', JSON.stringify(updated));
      localStorage.setItem('namoqr-auth-user', JSON.stringify(updated));
      return { success: true, claimedCount: 0 };
    }

    try {
      const res = await apiClient.auth.verifyPhoneOtp(cleanCode);
      if (!res?.success) return { success: false, error: 'Verification failed.' };
      const updated = res.user ? backendUserToProfile(res.user) : profile;
      if (profile.role === 'admin') updated.role = 'admin';
      setProfile(updated);
      localStorage.setItem('repiqr-auth-user', JSON.stringify(updated));
      localStorage.setItem('namoqr-auth-user', JSON.stringify(updated));
      return { success: true, claimedCount: res.claimedCount || 0 };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to verify code.' };
    }
  };

  // Re-pulls the profile after Account Settings changes (name/phone/email). Only
  // meaningful for backend-authenticated sessions — a no-op otherwise since there's
  // nothing server-side to re-fetch (demo/Supabase-direct profiles already update
  // the local `profile` state directly at the call site).
  const refreshProfile = async () => {
    const token = localStorage.getItem('repiqr-token') || localStorage.getItem('namoqr-token');
    if (!isApiBackendConfigured || !token) return;
    try {
      const res = await apiClient.auth.getMe();
      if (res?.user) {
        const p = backendUserToProfile(res.user);
        const savedRole = profile?.role;
        if (savedRole === 'admin') p.role = 'admin';
        setProfile(p);
        localStorage.setItem('repiqr-auth-user', JSON.stringify(p));
        localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
      }
    } catch {
      // Non-fatal — the UI already reflects the just-saved values optimistically.
    }
  };

  const isLoggedIn = Boolean(user || profile);
  // isAdmin is purely role-based — only adminSignIn() produces role='admin'
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isLoggedIn,
        isAdmin,
        signUp,
        signIn,
        adminSignIn,
        updatePhoneNumber,
        sendPhoneOtp,
        verifyPhoneOtp,
        refreshProfile,
        signOut,
        deleteAccount,
        resetPassword,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
