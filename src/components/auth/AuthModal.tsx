import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured, getAuthCallbackUrl } from '../../lib/supabase';
import AppLogo from '../common/AppLogo';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';

const AUTH_IMAGES = [
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200', // Car 1
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1200', // Bike
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200', // House
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200', // Car 2
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'signup';
  prefillEmail?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  prefillEmail = '',
}: AuthModalProps) {
  const { signIn, signUp, resetPassword, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  // Single Input for Email / Phone / Activation Code
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % AUTH_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && prefillEmail) {
      setIdentifier(prefillEmail);
      setMode('signup');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, prefillEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!identifier.trim()) {
          setErrorMsg('Please enter your email, phone number, or activation code.');
          setLoading(false);
          return;
        }
        const res = await signIn(identifier.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to sign in.');
        } else {
          setSuccessMsg('Signed in successfully!');
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 500);
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (!identifier.trim()) {
          setErrorMsg('Please enter your email address.');
          setLoading(false);
          return;
        }
        const res = await signUp(identifier.trim(), password, fullName, signupPhone.trim() || undefined);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        } else {
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 500);
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(identifier.trim());
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to send reset link.');
        } else {
          setSuccessMsg(res.message || 'Password reset link sent to your email.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    if (isSupabaseConfigured) {
      try {
        localStorage.setItem('repiqr-current-page', 'dashboard');
        localStorage.setItem('namoqr-current-page', 'dashboard');
      } catch {
        // Fallback if localStorage access is blocked
      }
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl('/auth/callback'),
        },
      });
      return;
    }
    demoLogin();
    setSuccessMsg('Logged in as Demo User');
    setTimeout(() => {
      onClose();
      if (onSuccess) onSuccess();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[500] flex animate-fade-in bg-[#FAFAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Left 50% Brand Panel with Image Loop ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 text-white relative overflow-hidden bg-zinc-950">
        {AUTH_IMAGES.map((imgUrl, index) => (
          <div
            key={imgUrl}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentImgIndex ? 'opacity-100 scale-105 pointer-events-auto' : 'opacity-0 scale-100 pointer-events-none'
            }`}
            style={{
              transitionProperty: 'opacity, transform',
              transitionDuration: '1200ms',
              backgroundImage: `linear-gradient(to bottom, rgba(9,9,11,0.65) 0%, rgba(9,9,11,0.90) 65%, rgba(9,9,11,0.98) 100%), url('${imgUrl}')`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ))}

        <div className="relative z-10">
          <div className="mb-16 flex items-center justify-between">
            <AppLogo variant="dark" className="h-10 sm:h-12 w-auto object-contain" />

            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {AUTH_IMAGES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImgIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentImgIndex ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6 drop-shadow-lg">
            {mode === 'login' && 'Welcome back.'}
            {mode === 'signup' && 'One QR. Lifetime protection.'}
            {mode === 'forgot' && 'Reset your password.'}
          </h1>

          <p className="text-base text-gray-300 leading-relaxed max-w-md drop-shadow-sm font-medium">
            {mode === 'login'
              ? 'Log in using your email address, phone number, or sticker activation code.'
              : 'Privacy-first smart QR safety for your vehicles, home, and family. No app required.'}
          </p>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-6 space-y-3">
          <div className="text-sm font-semibold text-gray-200">• Instant Phone, Email & Code Sign In</div>
          <div className="text-sm font-semibold text-gray-200">• 100% Anonymous phone & alert routing</div>
          <div className="text-sm font-semibold text-gray-200">• Lifetime protection with zero subscription fees</div>
        </div>
      </div>

      {/* ── Right 50% Clean Form Panel ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between overflow-y-auto bg-white p-8 lg:p-16">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            ← Back to website
          </button>

          <div className="flex lg:hidden items-center">
            <AppLogo variant="light" className="h-8 w-auto object-contain" />
          </div>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {mode === 'login' && 'Sign in to RapiQR'}
              {mode === 'signup' && 'Create your RapiQR account'}
              {mode === 'forgot' && 'Reset password'}
            </h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {mode === 'login' && 'Enter your email, phone number, or activation code below'}
              {mode === 'signup' && 'Get instant safety tag management for your family & fleet'}
              {mode === 'forgot' && 'Enter your registered email to receive a password reset link'}
            </p>

            {/* Auth Tab Switcher */}
            {mode !== 'forgot' && (
              <div className="flex bg-gray-100 p-1.5 rounded-xl mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'login' ? 'bg-[#0F172A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'signup' ? 'bg-[#0F172A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Google Quick Sign-In */}
          {mode !== 'forgot' && (
            <div>
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest absolute">
                  or
                </span>
              </div>
            </div>
          )}

          {/* Clean 1-Input Display Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mihir Rathod"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/15 transition-all text-gray-900 font-medium"
                />
              </div>
            )}

            {/* Single Input: Email, Phone Number, or Activation Code */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wider">
                {mode === 'login' ? 'Email, Phone, or Tag Code' : 'Email Address'}
              </label>
              <input
                type={mode === 'signup' ? 'email' : 'text'}
                required
                placeholder={
                  mode === 'login'
                    ? 'e.g. name@example.com, +1 555-0199, or QR-101'
                    : 'name@example.com'
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/15 transition-all text-gray-900 font-medium"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-wider">
                  Phone Number
                </label>
                <PhoneInputWithCountry
                  value={signupPhone}
                  onChange={(full) => setSignupPhone(full)}
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-[#D97706] hover:underline font-bold"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-16 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/15 transition-all text-gray-900 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-extrabold text-white text-sm bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.99] transition-all shadow-md cursor-pointer disabled:opacity-60 mt-2"
            >
              {loading ? (
                <span className="text-xs font-bold tracking-wider uppercase">Processing...</span>
              ) : (
                <>
                  {mode === 'forgot' && 'Send Password Reset Link'}
                  {mode === 'login' && 'Sign In to Dashboard'}
                  {mode === 'signup' && 'Create Account'}
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full text-center text-xs text-gray-600 hover:text-black font-bold pt-2 block cursor-pointer"
              >
                ← Back to Login
              </button>
            )}
          </form>
        </div>

        <div className="text-center text-xs text-gray-400 font-medium pt-8">
          Encrypted &amp; Secured by RapiQR Relay
        </div>
      </div>
    </div>
  );
}
