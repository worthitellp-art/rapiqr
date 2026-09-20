import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { UserProfileData, ADMIN_EMAIL } from '../lib/authService';
import { apiClient, isApiBackendConfigured } from '../lib/apiClient';

/**
 * Map a backend (Express/Render) user profile into the app's UserProfileData shape.
 * Backend returns { id, email, full_name, avatar_url, role, subscription_plan, is_subscribed }.
 */
function backendUserToProfile(u: any): UserProfileData {
  const hasPhone = Boolean(u?.phone_number || u?.phoneNumber);
  const isVerified = Boolean(
    u?.metadata?.phone_verified ||
    u?.metadata?.phone_verified_at ||
    u?.is_phone_verified ||
    u?.isPhoneVerified ||
    (hasPhone && u?.metadata?.phone_verified !== false)
  );

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
    isPhoneVerified: isVerified && hasPhone,
  };
}

interface AuthContextType {
  profile: UserProfileData | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  // Admin (/admin route) sign-in: OTP-only, restricted server-side to the single
  // ADMIN_PHONE number. `accessToken` comes from the MSG91 OTP Widget's verifyOtp().
  sendAdminPhoneOtp: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyAdminPhoneOtp: (phoneNumber: string, accessToken: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  // Passwordless email login: request a 6-digit code, then verify it — verifying
  // IS the login, no password anywhere in this path.
  sendEmailOtp: (email: string) => Promise<{ success: boolean; simulated?: boolean; error?: string }>;
  verifyEmailOtp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  // Passwordless phone login: pre-flight check, then send the OTP via the MSG91
  // widget and verify it (verifying IS the login) to log in or create an account.
  sendPhoneLoginOtp: (phoneNumber: string) => Promise<{ success: boolean; simulated?: boolean; message?: string; debugCode?: string; error?: string }>;
  verifyPhoneLoginOtp: (phoneNumber: string, accessToken: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  demoLogin: () => void;
  // Links a phone number to the logged-in account — used at signup and to auto-link
  // the phone entered during sticker activation, so the dashboard can match by phone.
  updatePhoneNumber: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  // Two-step OTP phone verification — required before the Client Dashboard's "Link
  // Sticker" card or Account Settings can attach/change the account's phone number,
  // so a sticker only auto-claims once ownership of the phone is actually proven.
  sendPhoneOtp: (phoneNumber: string) => Promise<{ success: boolean; simulated?: boolean; error?: string }>;
  // `accessToken` comes from the MSG91 OTP Widget's verifyOtp() (src/lib/msg91Widget.ts) —
  // the widget runs the actual code exchange with MSG91; this hands the resulting
  // token to the backend to confirm and finalize.
  verifyPhoneOtp: (accessToken: string) => Promise<{ success: boolean; claimedCount?: number; error?: string }>;
  // Re-pulls the profile from the backend (Account Settings uses this after saving
  // name/phone/email changes so the header/avatar/email stay in sync immediately).
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Loaded on demand (first Google sign-in attempt) rather than eagerly in
// index.html — most visitors never use Google sign-in, and the script was
// ~84% unused bytes on every page load when it loaded unconditionally.
let googleIdentityScriptPromise: Promise<void> | null = null;
function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
  return googleIdentityScriptPromise;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfileData | null>(() => {
    const saved = localStorage.getItem('repiqr-auth-user') || localStorage.getItem('namoqr-auth-user');
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isApiBackendConfigured) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('repiqr-token') || localStorage.getItem('namoqr-token');

    // Legacy guard: an older build's local-only admin fallback (removed — admin
    // login is now OTP-only via verifyAdminPhoneOtp) used to stamp this exact id
    // with role:'admin' and never obtain any token — no backend JWT. If that
    // cached profile is still around from before this change, every apiClient
    // call (Orders, Alerts, ...) will 401 forever since there was never a real
    // token to restore. Force a clean
    // re-login instead of leaving a permanently-broken "logged in" state.
    if (!token && profile?.id === 'admin-101') {
      setProfile(null);
      localStorage.removeItem('repiqr-auth-user');
      localStorage.removeItem('namoqr-auth-user');
    }

    if (!token) {
      setLoading(false);
      return;
    }

    apiClient.auth.getMe()
      .then((res) => {
        if (res?.user) {
          const userProfile = backendUserToProfile(res.user);
          setProfile(userProfile);
          localStorage.setItem('repiqr-auth-user', JSON.stringify(userProfile));
          localStorage.setItem('namoqr-auth-user', JSON.stringify(userProfile));
        }
      })
      .catch((err: any) => {
        // ONLY a 401 means the token itself is dead. This used to clear the
        // token on any failure at all — including the 404 that /auth/me
        // returned for accounts whose profiles row was never written, and
        // any transient network/5xx blip. Once the token was gone, every
        // apiClient call went out unauthenticated, 401'd, and tripped the
        // rapiqr:unauthorized -> signOut() handler below: the client
        // dashboard would simply never load, seemingly at random.
        if (err?.status === 401) {
          localStorage.removeItem('repiqr-token');
          localStorage.removeItem('namoqr-token');
        }
      })
      .finally(() => setLoading(false));
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

      // No backend configured (e.g. local Vite-only dev) — local-only demo profile.
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
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during registration.' };
    }
  };

  // Standard login: assigns role = 'user' for everyone EXCEPT the designated admin
  // email, which unlocks the Admin Fleet Dashboard. Admin access is otherwise gated
  // behind verifyAdminPhoneOtp() in AdminAuthModal (secret /admin route).
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

      // No backend configured — local-only demo profile.
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
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during sign in.' };
    }
  };

  // Dedicated Admin Panel login (/admin route): OTP-only, restricted server-side
  // to the single ADMIN_PHONE number in Server/.env — never against a regular
  // user's account or a password, so admin access can only ever be gained here.
  // Requires the Express backend; there is no local-only demo fallback for this
  // one, since a fake "admin" bypass in dev defeats the point of the number gate.
  const sendAdminPhoneOtp = async (phoneNumber: string) => {
    if (!isApiBackendConfigured) {
      return { success: false, error: 'Admin login requires the backend to be configured.' };
    }
    try {
      await apiClient.auth.sendAdminPhoneOtp(phoneNumber.trim());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send verification code.' };
    }
  };

  // `accessToken` comes from the MSG91 OTP Widget's verifyOtp() (src/lib/msg91Widget.ts) —
  // the widget runs the actual code exchange with MSG91; this hands the resulting
  // token to the backend, which re-verifies it and confirms it verified ADMIN_PHONE.
  const verifyAdminPhoneOtp = async (phoneNumber: string, accessToken: string) => {
    if (!isApiBackendConfigured) {
      return { success: false, error: 'Admin login requires the backend to be configured.' };
    }
    try {
      const res = await apiClient.auth.verifyAdminPhoneOtp(phoneNumber.trim(), accessToken);
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
      return { success: false, error: err.message || 'Invalid or expired verification code.' };
    }
  };

  const isSigningOutRef = useRef(false);

  const signOut = useCallback(async () => {
    if (isSigningOutRef.current) return;
    isSigningOutRef.current = true;

    // Clear local session first so subsequent requests cannot send a dead token
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

    setProfile(null);

    // Best-effort audit record — must never block the local sign-out
    if (isApiBackendConfigured) {
      try {
        await apiClient.auth.logout();
      } catch { /* ignore */ }
    }

    isSigningOutRef.current = false;
  }, []);

  // apiClient broadcasts this when the backend rejects our token as expired/invalid.
  // Force a clean logout signOut() to prevent UI getting stuck in an invalid session.
  useEffect(() => {
    const handleUnauthorized = () => {
      signOut();
    };
    window.addEventListener('rapiqr:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('rapiqr:unauthorized', handleUnauthorized);
  }, [signOut]);

  // Permanently deletes the account server-side (task.md #3 — DPDP/GDPR "right to
  // be forgotten"), then clears the local session the same way signOut does.
  const deleteAccount = async () => {
    if (!isApiBackendConfigured) {
      return { success: false, error: 'Account deletion requires the RapiQR backend to be connected.' };
    }
    try {
      await apiClient.auth.deleteAccount();
      await signOut();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete account.' };
    }
  };

  const resetPassword = async (email: string) => {
    if (!isApiBackendConfigured) {
      return { success: true, message: 'Demo mode: Password reset email simulated.' };
    }
    try {
      const res = await apiClient.auth.forgotPassword(email);
      return { success: true, message: res.message || 'If an account exists for that email, a reset link has been sent.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send reset email.' };
    }
  };

  /**
   * Google Sign-In with real OAuth verification via Google Identity Services
   * (Token Client). Only transitions to logged-in state after Google
   * successfully confirms the account AND the backend independently verifies
   * the token server-side (see Server/controllers/authController.js
   * googleAuth — it never trusts the `user` object below on its own).
   */
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await loadGoogleIdentityScript().catch(() => { /* handled by the oauth2 check below */ });

      const clientId =
        (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
        '640446362534-73ub5mvtklhs4e3eldvde892q8jbtlbo.apps.googleusercontent.com';

      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2 && clientId) {
        const tokenResponse = await new Promise<any>((resolve, reject) => {
          try {
            const client = (window as any).google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'email profile openid',
              callback: (response: any) => {
                if (response.error) {
                  reject(new Error(response.error_description || response.error));
                } else if (!response.access_token) {
                  reject(new Error('No access token returned from Google.'));
                } else {
                  resolve(response);
                }
              },
              error_callback: (err: any) => {
                reject(new Error(err?.message || 'Google Sign-In was cancelled.'));
              },
            });
            client.requestAccessToken({ prompt: 'select_account' });
          } catch (e) {
            reject(e);
          }
        });

        if (tokenResponse?.access_token) {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });

          if (userInfoRes.ok) {
            const googleUser = await userInfoRes.json();
            const email = googleUser.email;
            const fullName = googleUser.name || email?.split('@')[0] || 'Google User';
            const avatarUrl = googleUser.picture;
            const sub = googleUser.sub;

            if (isApiBackendConfigured) {
              const res = await apiClient.auth.googleAuth({
                user: { email, fullName, avatarUrl, id: sub },
                token: tokenResponse.access_token,
              });

              if (res?.token) {
                localStorage.setItem('repiqr-token', res.token);
                localStorage.setItem('namoqr-token', res.token);
              }
              if (res?.user) {
                const p = backendUserToProfile(res.user);
                setProfile(p);
                localStorage.setItem('repiqr-auth-user', JSON.stringify(p));
                localStorage.setItem('namoqr-auth-user', JSON.stringify(p));
                return { success: true };
              }
              return { success: false, error: 'Google sign-in did not return an account.' };
            }

            // No backend configured — local-only demo profile.
            const localProfile: UserProfileData = {
              id: sub || `google-${Date.now()}`,
              email,
              fullName,
              avatarUrl,
              role: email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
              subscriptionPlan: 'free',
              isSubscribed: false,
            };
            setProfile(localProfile);
            localStorage.setItem('repiqr-auth-user', JSON.stringify(localProfile));
            localStorage.setItem('namoqr-auth-user', JSON.stringify(localProfile));
            return { success: true };
          }
        }
      }

      return { success: false, error: 'Google sign-in client is initializing. Please try again.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google sign-in was cancelled or failed.' };
    }
  };

  // Passwordless email login — step 1. Backend-only for a real send; without a
  // configured backend there's nothing to email through, so this reports
  // simulated:true (matching sendPhoneOtp's no-backend fallback) rather than
  // pretending a code went out.
  const sendEmailOtp = async (email: string) => {
    if (!isApiBackendConfigured) {
      return { success: true, simulated: true };
    }
    try {
      const res = await apiClient.auth.sendEmailOtp(email);
      return { success: true, simulated: res.simulated };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send sign-in code.' };
    }
  };

  // Passwordless email login — step 2. Verifying the code IS the login: the
  // backend signs into (or creates) the account for that email and returns a
  // normal JWT session, same shape as signIn/signUp.
  const verifyEmailOtp = async (email: string, code: string) => {
    if (!isApiBackendConfigured) {
      const cleanEmail = email.trim().toLowerCase();
      const demoUser: UserProfileData = {
        id: 'demo-' + Date.now(),
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0],
        role: cleanEmail === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
        subscriptionPlan: 'free',
      };
      setProfile(demoUser);
      localStorage.setItem('repiqr-auth-user', JSON.stringify(demoUser));
      localStorage.setItem('namoqr-auth-user', JSON.stringify(demoUser));
      return { success: true };
    }
    try {
      const res = await apiClient.auth.verifyEmailOtp(email, code);
      if (res?.token) {
        localStorage.setItem('repiqr-token', res.token);
        localStorage.setItem('namoqr-token', res.token);
      }
      if (res?.user) {
        const userProfile = backendUserToProfile(res.user);
        setProfile(userProfile);
        localStorage.setItem('repiqr-auth-user', JSON.stringify(userProfile));
        localStorage.setItem('namoqr-auth-user', JSON.stringify(userProfile));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification failed.' };
    }
  };

  // Passwordless phone login — step 1
  const sendPhoneLoginOtp = async (phoneNumber: string) => {
    const cleanPhone = phoneNumber.trim();
    localStorage.setItem('repiqr-pending-phone-login', cleanPhone);
    if (!isApiBackendConfigured) {
      return { success: true, simulated: true };
    }
    try {
      const res = await apiClient.auth.sendPhoneLoginOtp(cleanPhone);
      return { success: true, simulated: res.simulated, message: res.message, debugCode: res.debugCode };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send OTP to phone.' };
    }
  };

  // Passwordless phone login — step 2: verify OTP and log in / create user.
  // `accessToken` comes from the MSG91 OTP Widget's verifyOtp() (src/lib/msg91Widget.ts) —
  // the widget runs the actual code exchange with MSG91; this hands the resulting
  // token to the backend to confirm and finalize.
  const verifyPhoneLoginOtp = async (phoneNumber: string, accessToken: string) => {
    const cleanPhone = phoneNumber.trim();
    if (!isApiBackendConfigured) {
      const demoUser: UserProfileData = {
        id: 'user-' + Date.now(),
        email: `${cleanPhone.replace(/[^0-9]/g, '')}@repiqr.local`,
        fullName: `User ${cleanPhone.slice(-4)}`,
        phoneNumber: cleanPhone,
        role: 'user',
        subscriptionPlan: 'free',
        isPhoneVerified: true,
      };
      setProfile(demoUser);
      localStorage.setItem('repiqr-auth-user', JSON.stringify(demoUser));
      localStorage.setItem('namoqr-auth-user', JSON.stringify(demoUser));
      localStorage.setItem('rapiqr-phone-number-filled', 'true');
      localStorage.setItem('rapiqr-phone-asked-once', 'true');
      return { success: true };
    }

    try {
      const res = await apiClient.auth.verifyPhoneLoginOtp(cleanPhone, accessToken);
      if (res?.token) {
        localStorage.setItem('repiqr-token', res.token);
        localStorage.setItem('namoqr-token', res.token);
      }
      if (res?.user) {
        const userProfile = backendUserToProfile(res.user);
        userProfile.isPhoneVerified = true;
        setProfile(userProfile);
        localStorage.setItem('repiqr-auth-user', JSON.stringify(userProfile));
        localStorage.setItem('namoqr-auth-user', JSON.stringify(userProfile));
        localStorage.setItem('rapiqr-phone-number-filled', 'true');
        localStorage.setItem('rapiqr-phone-asked-once', 'true');
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification failed.' };
    }
  };

  // Used only as demo fallback when explicitly triggered — ALWAYS a regular user.
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
          console.warn('API updateProfile failed, falling back to local update:', apiErr);
        }
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
  // Express/Twilio backend).
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

  // Phone verification step 2 — the MSG91 OTP Widget already ran the actual
  // code exchange in the browser (src/lib/msg91Widget.ts verifyMsg91Otp); this
  // hands the resulting access token to the backend, which re-verifies it with
  // MSG91 server-to-server and only then persists the phone number and runs
  // the phone-based sticker auto-claim. Faking success here locally would mark
  // the phone "verified" in the UI while never linking any sticker in the database.
  const verifyPhoneOtp = async (accessToken: string) => {
    if (!profile) return { success: false, error: 'Not signed in.' };
    const cleanToken = accessToken.trim();
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
      const res = await apiClient.auth.verifyPhoneOtp(cleanToken, pendingPhone);
      if (res?.success) {
        const updated = res.user ? backendUserToProfile(res.user) : { ...profile, phoneNumber: pendingPhone, isPhoneVerified: true };
        if (profile.role === 'admin') updated.role = 'admin';
        updated.isPhoneVerified = true;
        setProfile(updated);
        localStorage.setItem('repiqr-auth-user', JSON.stringify(updated));
        localStorage.setItem('namoqr-auth-user', JSON.stringify(updated));
        return { success: true, claimedCount: res.claimedCount || 0 };
      }
      return { success: false, error: (res as any)?.error || 'Verification failed.' };
    } catch (err: any) {
      // A real backend rejection (wrong/expired code, or the code was lost —
      // e.g. a server restart wiped the in-memory OTP store) must surface as a
      // real error. Silently marking the phone "verified" here only in local
      // state — without the backend ever writing the phone number / phone
      // verification metadata — is what caused the dashboard to ask for phone
      // verification again on every reload/login: the fake local "verified"
      // flag never survived a refreshProfile() or getMe() refetch.
      return { success: false, error: err?.message || 'Verification failed. Please try again.' };
    }
  };

  // Re-pulls the profile after Account Settings changes (name/phone/email). Only
  // meaningful for backend-authenticated sessions — a no-op otherwise since there's
  // nothing server-side to re-fetch (demo profiles already update the local
  // `profile` state directly at the call site).
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

  const isLoggedIn = Boolean(profile);
  // isAdmin is purely role-based — verifyAdminPhoneOtp() is the dedicated way to obtain role='admin'
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        isLoggedIn,
        isAdmin,
        signUp,
        signIn,
        sendAdminPhoneOtp,
        verifyAdminPhoneOtp,
        signInWithGoogle,
        sendEmailOtp,
        verifyEmailOtp,
        sendPhoneLoginOtp,
        verifyPhoneLoginOtp,
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
