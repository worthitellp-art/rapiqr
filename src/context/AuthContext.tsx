import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getAuthCallbackUrl } from '../lib/supabase';
import { getUserProfile, updateProfilePhoneNumber, UserProfileData } from '../lib/authService';
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
    avatarUrl: u?.avatar_url || u?.avatarUrl,
    role: (u?.role as 'user' | 'admin') || 'user',
    subscriptionPlan: u?.subscription_plan || u?.subscriptionPlan || 'free',
    isSubscribed: u?.is_subscribed ?? u?.isSubscribed ?? false,
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
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  demoLogin: () => void;
  // Links a phone number to the logged-in account — used at signup and to auto-link
  // the phone entered during sticker activation, so the dashboard can match by phone.
  updatePhoneNumber: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(() => {
    const saved = localStorage.getItem('namoqr-auth-user');
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Backend session restore first (when a backend token exists)
    if (isApiBackendConfigured) {
      const token = localStorage.getItem('namoqr-token');
      if (token) {
        apiClient.auth.getMe()
          .then((res) => {
            if (res?.user) {
              const p = backendUserToProfile(res.user);
              // Admin role only carries over from a previously-established admin session
              // (set by adminSignIn) — never granted just by email match here.
              const saved = localStorage.getItem('namoqr-auth-user');
              const savedRole = saved ? JSON.parse(saved).role : null;
              if (savedRole === 'admin') {
                p.role = 'admin';
              }
              setProfile(p);
              localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
            }
          })
          .catch(() => {
            // Token invalid/expired — clear it; Supabase flow below will take over.
            localStorage.removeItem('namoqr-token');
          });
      }
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      setUser(initSession?.user ?? null);
      if (initSession?.user) {
        getUserProfile(initSession.user.id, initSession.user.email || '').then((p) => {
          if (p) {
            // Admin role only carries over from a previously-established admin session.
            const saved = localStorage.getItem('namoqr-auth-user');
            const savedRole = saved ? JSON.parse(saved).role : null;
            p.role = savedRole === 'admin' ? 'admin' : 'user';
            setProfile(p);
            localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
          }
        });
      }
      setLoading(false);
    });

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (currentSession?.user) {
          const userProfile = await getUserProfile(currentSession.user.id, currentSession.user.email || '');
          if (userProfile) {
            // Admin role only carries over from a previously-established admin session
            // (set by adminSignIn) — a normal sign-in never unlocks admin,
            // even if the email happens to match the designated admin address.
            const saved = localStorage.getItem('namoqr-auth-user');
            const savedRole = saved ? JSON.parse(saved).role : null;
            userProfile.role = savedRole === 'admin' ? 'admin' : 'user';
            setProfile(userProfile);
            localStorage.setItem('namoqr-auth-user', JSON.stringify(userProfile));
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        localStorage.removeItem('namoqr-auth-user');
      }

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
        const res = await apiClient.auth.signUp(email, password, fullName);
        if (res?.token) localStorage.setItem('namoqr-token', res.token);
        if (res?.user) {
          const p = backendUserToProfile(res.user);
          p.role = 'user';
          if (phoneNumber) p.phoneNumber = phoneNumber;
          setProfile(p);
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
          localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during registration.' };
    }
  };

  // Standard login: ALWAYS assigns role = 'user' so regular users go to Client Dashboard.
  // Admin access is only available through adminSignIn() in the AdminAuthModal.
  const signIn = async (email: string, password: string) => {
    try {
      // Backend-first signin when the Render API is configured
      if (isApiBackendConfigured) {
        const res = await apiClient.auth.signIn(email, password);
        if (res?.token) localStorage.setItem('namoqr-token', res.token);
        if (res?.user) {
          const p = backendUserToProfile(res.user);
          p.role = 'user'; // regular login never unlocks admin
          setProfile(p);
          localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
        }
        return { success: true };
      }

      if (!isSupabaseConfigured) {
        const demoUser: UserProfileData = { 
          id: 'demo-user', 
          email, 
          fullName: email.split('@')[0] || 'User',
          role: 'user',
          subscriptionPlan: 'free'
        };
        setProfile(demoUser);
        localStorage.setItem('namoqr-auth-user', JSON.stringify(demoUser));
        return { success: true };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { success: false, error: error.message };

      if (data.user) {
        // Force role to 'user' — even if DB has admin, regular login doesn't unlock admin
        const p = await getUserProfile(data.user.id, data.user.email || email);
        if (p) {
          p.role = 'user';
          setProfile(p);
          localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
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
          localStorage.setItem('namoqr-token', res.token);
          setProfile(p);
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
      localStorage.setItem('namoqr-auth-user', JSON.stringify(adminUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Admin authentication failed.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('namoqr-token');
    setSession(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('namoqr-auth-user');
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
    localStorage.setItem('namoqr-auth-user', JSON.stringify(demoUser));
  };

  // Links a phone number to the currently logged-in account. Used at signup and to
  // auto-link the phone entered during sticker activation (ScanPage) to the account,
  // so the Client Dashboard can match previously-activated stickers by phone number.
  const updatePhoneNumber = async (phoneNumber: string) => {
    if (!profile) return { success: false, error: 'Not signed in.' };
    try {
      if (isSupabaseConfigured && !profile.id.startsWith('demo-') && profile.id !== 'demo-user') {
        const ok = await updateProfilePhoneNumber(profile.id, phoneNumber);
        if (!ok) return { success: false, error: 'Failed to save phone number.' };
      }
      const updated = { ...profile, phoneNumber };
      setProfile(updated);
      localStorage.setItem('namoqr-auth-user', JSON.stringify(updated));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save phone number.' };
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
        signOut,
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
