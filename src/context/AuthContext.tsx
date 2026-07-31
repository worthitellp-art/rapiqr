import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getUserProfile, UserProfileData, ADMIN_EMAIL } from '../lib/authService';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfileData | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  demoLogin: () => void;
  adminDemoLogin: () => void;
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
            const saved = localStorage.getItem('namoqr-auth-user');
            const savedRole = saved ? JSON.parse(saved).role : null;
            if (savedRole === 'admin' || initSession.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
              p.role = 'admin';
            }
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
            const saved = localStorage.getItem('namoqr-auth-user');
            const savedRole = saved ? JSON.parse(saved).role : null;
            if (savedRole === 'admin' || currentSession.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
              userProfile.role = 'admin';
            }
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
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      if (!isSupabaseConfigured) {
        const newUser: UserProfileData = { 
          id: 'demo-' + Date.now(), 
          email, 
          fullName, 
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

  // Dedicated Admin Panel login: Requires admin credentials
  const adminSignIn = async (email: string, password: string) => {
    try {
      // Validate email format
      if (!email.includes('@')) {
        return { success: false, error: 'Invalid admin email address.' };
      }

      if (!isSupabaseConfigured) {
        if (password.length < 4) {
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
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { success: false, error: error.message };

      if (data.user) {
        const p = await getUserProfile(data.user.id, data.user.email || email);
        if (p?.role !== 'admin' && email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
          return { success: false, error: 'Access Denied: This account does not have Admin Fleet privileges.' };
        }
        setProfile(p);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Admin authentication failed.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
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
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) return { success: false, error: error.message };
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send reset email.' };
    }
  };

  const demoLogin = () => {
    const demoAdmin: UserProfileData = {
      id: 'admin-demo-' + Date.now(),
      email: 'worthitellp@gmail.com',
      fullName: 'Demo Admin',
      role: 'admin',
      subscriptionPlan: 'enterprise',
      isSubscribed: true,
    };
    setProfile(demoAdmin);
    localStorage.setItem('namoqr-auth-user', JSON.stringify(demoAdmin));
  };

  const adminDemoLogin = () => {
    const adminUser: UserProfileData = {
      id: 'admin-demo',
      email: 'worthitellp@gmail.com',
      fullName: 'WorthIT Fleet Admin',
      role: 'admin',
      subscriptionPlan: 'enterprise',
      isSubscribed: true,
    };
    setProfile(adminUser);
    localStorage.setItem('namoqr-auth-user', JSON.stringify(adminUser));
  };

  const isLoggedIn = Boolean(user || profile);
  // isAdmin is purely role-based — only adminSignIn() and adminDemoLogin() produce role='admin'
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
        signOut,
        resetPassword,
        demoLogin,
        adminDemoLogin,
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
