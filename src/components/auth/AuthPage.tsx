import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import AppLogo from '../common/AppLogo';
import MinimalInput from './MinimalInput';
import { useAuthForm } from './hooks/useAuthForm';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  prefillEmail?: string;
  onModeChange?: (mode: 'login' | 'signup') => void;
  onBackHome: () => void;
  onSuccess: () => void;
}

export default function AuthPage({
  initialMode = 'login',
  prefillEmail = '',
  onModeChange,
  onBackHome,
  onSuccess,
}: AuthPageProps) {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  const {
    email,
    password,
    fullName,
    isSubmitting,
    errorMessage,
    successMessage,
    otpCode,
    otpSent,
    setEmail,
    setPassword,
    setFullName,
    setOtpCode,
    switchAuthMode,
    handleEmailSubmit,
    handlePasswordResetSubmit,
    handleGoogleAuthentication,
    handleSendEmailOtp,
    handleVerifyEmailOtp,
  } = useAuthForm({
    isOpen: true,
    initialMode: currentView === 'forgot' ? 'login' : currentView,
    prefillEmail,
    onClose: onBackHome,
    onSuccess,
  });

  // Keep state synchronized with external routing or mode changes
  useEffect(() => {
    if (initialMode) {
      setCurrentView(initialMode);
      switchAuthMode(initialMode);
    }
  }, [initialMode, switchAuthMode]);

  const handleSwitchToLogin = () => {
    setCurrentView('login');
    switchAuthMode('login');
    onModeChange?.('login');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login');
    }
  };

  const handleSwitchToSignup = () => {
    setCurrentView('signup');
    switchAuthMode('signup');
    onModeChange?.('signup');
    if (typeof window !== 'undefined' && window.location.pathname !== '/register') {
      window.history.replaceState({}, '', '/register');
    }
  };

  const handleSwitchToForgot = () => {
    setCurrentView('forgot');
  };

  const handleFormSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentView === 'forgot') {
      await handlePasswordResetSubmit(event);
      return;
    }
    if (currentView === 'login' && loginMethod === 'otp') {
      if (otpSent) {
        await handleVerifyEmailOtp(event);
      } else {
        await handleSendEmailOtp(event);
      }
      return;
    }
    await handleEmailSubmit(event);
  };

  return (
    <div className="auth-scope min-h-screen w-full flex flex-col justify-between bg-[#FAFAF8] text-[#14120C] selection:bg-[#FFD444] selection:text-[#14120C] font-sans antialiased">
      {/* ── Top Bar ── */}
      <header className="w-full max-w-5xl mx-auto px-5 py-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#14120C]/60 hover:text-[#14120C] transition-colors cursor-pointer py-1.5 px-3 rounded-full hover:bg-[#14120C]/[0.04]"
        >
          <ArrowLeft size={16} />
          <span>Back to home</span>
        </button>

        <a
          href="mailto:support@repiqr.com"
          className="text-xs sm:text-sm font-semibold text-[#14120C]/50 hover:text-[#14120C] transition-colors"
        >
          Need help?
        </a>
      </header>

      {/* ── Centered Clean Auth Card ── */}
      <main className="w-full my-auto flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] mx-auto bg-white rounded-[32px] border border-[#14120C]/8 p-7 sm:p-10 shadow-[0_20px_50px_-20px_rgba(20,18,12,0.06)]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <button
              onClick={onBackHome}
              className="cursor-pointer focus:outline-hidden"
              aria-label="RepiQR home"
            >
              <AppLogo variant="light" className="h-8 w-auto object-contain" />
            </button>
          </div>

          {/* Mode Switcher (Sign In vs Create Account) */}
          {currentView !== 'forgot' && (
            <div className="mb-6 p-1 rounded-full bg-[#14120C]/[0.04] border border-[#14120C]/6 flex items-center gap-1">
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className={`flex-1 py-2 text-xs sm:text-[13px] font-bold rounded-full transition-all cursor-pointer ${
                  currentView === 'login'
                    ? 'bg-white text-[#14120C] shadow-xs'
                    : 'text-[#14120C]/55 hover:text-[#14120C]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={handleSwitchToSignup}
                className={`flex-1 py-2 text-xs sm:text-[13px] font-bold rounded-full transition-all cursor-pointer ${
                  currentView === 'signup'
                    ? 'bg-white text-[#14120C] shadow-xs'
                    : 'text-[#14120C]/55 hover:text-[#14120C]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Header Titles */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#14120C]">
              {currentView === 'login' && 'Welcome back'}
              {currentView === 'signup' && 'Create your account'}
              {currentView === 'forgot' && 'Reset your password'}
            </h1>
            <p className="text-xs sm:text-sm text-[#14120C]/60 mt-1.5">
              {currentView === 'login' && 'Sign in to access your tags and dashboard'}
              {currentView === 'signup' && 'Protect your vehicle and assets with private QR tags'}
              {currentView === 'forgot' && "Enter your email and we'll send a recovery link"}
            </p>
          </div>

          {/* Google Quick Sign-In */}
          {currentView !== 'forgot' && (
            <div className="space-y-5 mb-6">
              <button
                type="button"
                onClick={handleGoogleAuthentication}
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl border border-[#14120C]/12 bg-white hover:bg-[#FAFAF8] hover:border-[#14120C]/25 active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-50 group"
              >
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs sm:text-sm ml-3 font-bold text-[#14120C]">
                  Continue with Google
                </span>
              </button>

              {/* Minimal Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[#14120C]/10" />
                <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-[#14120C]/40 absolute">
                  or
                </span>
              </div>
            </div>
          )}

          {/* Sign-in Method Tabs (Password vs OTP) */}
          {currentView === 'login' && (
            <div className="flex items-center justify-between mb-4 p-1 rounded-xl bg-[#14120C]/[0.03] border border-[#14120C]/6">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  loginMethod === 'password'
                    ? 'bg-white text-[#14120C] shadow-xs'
                    : 'text-[#14120C]/50 hover:text-[#14120C]'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'otp'
                    ? 'bg-white text-[#14120C] shadow-xs'
                    : 'text-[#14120C]/50 hover:text-[#14120C]'
                }`}
              >
                <span>Email Code (OTP)</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#FFD444] text-[#14120C] rounded-full font-bold">Fast</span>
              </button>
            </div>
          )}

          {/* Error / Success Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold flex items-start gap-2.5 text-left">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-semibold flex items-start gap-2.5 text-left">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Primary Form */}
          <form onSubmit={handleFormSubmission} className="space-y-4 text-left">
            {/* Full Name (Sign Up only) */}
            {currentView === 'signup' && (
              <MinimalInput
                id="fullName"
                label="Full Name"
                type="text"
                icon={User}
                value={fullName}
                onChange={setFullName}
                placeholder="Rahul Sharma"
                required
                autoComplete="name"
                disabled={isSubmitting}
                autoFocus
              />
            )}

            {/* Email Address */}
            <MinimalInput
              id="email"
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
              required
              autoComplete="email"
              disabled={isSubmitting}
              autoFocus={currentView !== 'signup'}
            />

            {/* Password Field (Sign Up OR Login with Password) */}
            {((currentView === 'login' && loginMethod === 'password') || currentView === 'signup') && (
              <div className="space-y-1">
                <MinimalInput
                  id="password"
                  label="Password"
                  type="password"
                  icon={Lock}
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  required
                  autoComplete={currentView === 'login' ? 'current-password' : 'new-password'}
                  disabled={isSubmitting}
                />

                {currentView === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSwitchToForgot}
                      className="text-xs font-semibold text-[#14120C]/60 hover:text-[#14120C] transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OTP Code Input (When Login with OTP and OTP is sent) */}
            {currentView === 'login' && loginMethod === 'otp' && otpSent && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="otpCode" className="text-xs font-bold text-[#14120C]/75">
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={isSubmitting}
                    className="text-xs font-bold text-[#14120C] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
                <input
                  id="otpCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-12 text-center text-xl tracking-[10px] font-mono font-bold bg-[#FAFAF8]/60 focus:bg-white border border-[#14120C]/15 focus:border-[#14120C] focus:ring-4 focus:ring-[#FFD444]/25 rounded-2xl outline-none text-[#14120C] shadow-xs transition-all"
                />
                <p className="text-[11px] text-[#14120C]/50 text-center">
                  We sent a code to <span className="font-bold text-[#14120C]">{email}</span>
                </p>
              </div>
            )}

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-2 rounded-2xl bg-[#14120C] hover:bg-black active:scale-[0.99] text-white font-bold text-sm sm:text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin text-white" />
                  <span>Please wait...</span>
                </>
              ) : (
                <>
                  <span>
                    {currentView === 'login' && loginMethod === 'password' && 'Sign In with Email'}
                    {currentView === 'login' && loginMethod === 'otp' && !otpSent && 'Send Sign-in Code'}
                    {currentView === 'login' && loginMethod === 'otp' && otpSent && 'Verify & Sign In'}
                    {currentView === 'signup' && 'Create Account'}
                    {currentView === 'forgot' && 'Send Recovery Link'}
                  </span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Footer Switches */}
          <div className="mt-6 text-center text-xs text-[#14120C]/60">
            {currentView === 'forgot' ? (
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="font-bold text-[#14120C] hover:underline transition-colors cursor-pointer"
              >
                ← Back to Sign In
              </button>
            ) : currentView === 'login' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToSignup}
                  className="font-bold text-[#14120C] hover:underline transition-colors cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="font-bold text-[#14120C] hover:underline transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Trust Footer */}
          <div className="mt-6 pt-4 border-t border-[#14120C]/8 flex items-center justify-center gap-2 text-[11px] text-[#14120C]/45">
            <ShieldCheck size={14} className="text-[#16A34A]" />
            <span>256-bit SSL encrypted • 100% Number Privacy</span>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full max-w-5xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#14120C]/40">
        <span>&copy; {new Date().getFullYear()} RapiQR Technologies. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="hover:text-[#14120C] transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-[#14120C] transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
