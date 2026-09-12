import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AppLogo from '../common/AppLogo';
import MinimalInput from './MinimalInput';
import AuthAlertMessage from './AuthAlertMessage';
import { useAuthForm } from './hooks/useAuthForm';
import authLandscapeImage from '../../assets/illustrations/auth-scenic-landscape.jpg';

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

  const {
    email,
    password,
    fullName,
    isSubmitting,
    errorMessage,
    successMessage,
    setEmail,
    setPassword,
    setFullName,
    switchAuthMode,
    handleEmailSubmit,
    handlePasswordResetSubmit,
    handleGoogleAuthentication,
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
    await handleEmailSubmit(event);
  };

  return (
    <div className="min-h-screen w-full relative bg-[#FDFDFD] flex flex-col justify-between overflow-x-hidden font-display text-slate-900 selection:bg-amber-400 selection:text-black">
      {/* ── Panoramic Watercolor Road Landscape (Grounding the bottom) ── */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none z-0 overflow-hidden leading-none">
        <img
          src={authLandscapeImage}
          alt="Scenic open road watercolor landscape"
          className="w-full h-[40vh] sm:h-[48vh] lg:h-[54vh] object-cover object-bottom opacity-95"
        />
        {/* Soft fade upward into paper-white background */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-[#FDFDFD] pointer-events-none" />
      </div>

      {/* ── Top Bar (Back button, Logo, Contact support) ── */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-5 sm:py-7 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div
          onClick={onBackHome}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <AppLogo variant="light" className="h-7 w-auto object-contain" />
        </div>

        <a
          href="mailto:support@repiqr.com"
          className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          Contact support
        </a>
      </header>

      {/* ── Centered Floating Authentication Card ── */}
      <main className="relative z-10 my-auto py-6 px-4 w-full flex items-center justify-center">
        <div className="w-full max-w-[390px] mx-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-6 sm:p-8 text-center animate-fade-in">
          {/* Header Title & Subtitle */}
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-slate-900 font-serif">
              {currentView === 'login' && 'Log in to RapiQR'}
              {currentView === 'signup' && 'Create your account'}
              {currentView === 'forgot' && 'Reset your password'}
            </h1>
            <p className="text-xs text-slate-400">
              {currentView === 'login' && 'Your vehicle safety starts here'}
              {currentView === 'signup' && 'Your vehicle protection starts here'}
              {currentView === 'forgot' && 'Enter your email to receive recovery instructions'}
            </p>
          </div>

          {/* Social Sign-In Buttons (Row of 3 buttons: X, Apple, Google) */}
          {currentView !== 'forgot' && (
            <div className="space-y-4 mb-5">
              <div className="flex items-center gap-2.5">
              
                

                <button
                  type="button"
                  onClick={handleGoogleAuthentication}
                  title="Continue with Google"
                  disabled={isSubmitting}
                  className="flex-1 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className='text-xs ml-2 text-slate-900'>Continue with Google</span>
                </button>
              </div>

              {/* Minimal Centered Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200/70" />
                <span className="bg-white px-2.5 text-[11px] font-normal text-slate-400 absolute">or</span>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          <AuthAlertMessage errorMessage={errorMessage} successMessage={successMessage} />

          {/* Credentials Form */}
          <form onSubmit={handleFormSubmission} className="space-y-3 text-left">
            {currentView === 'signup' && (
              <MinimalInput
                id="fullName"
                label="Full name"
                type="text"
                value={fullName}
                onChange={setFullName}
                placeholder="Rahul Sharma"
                required
                autoComplete="name"
                disabled={isSubmitting}
                autoFocus
              />
            )}

            <MinimalInput
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
              required
              autoComplete="email"
              disabled={isSubmitting}
              autoFocus={currentView !== 'signup'}
            />

            {currentView !== 'forgot' && (
              <div className="space-y-1">
                <MinimalInput
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  required
                  autoComplete={currentView === 'login' ? 'current-password' : 'new-password'}
                  disabled={isSubmitting}
                />

                {currentView === 'login' && (
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={handleSwitchToForgot}
                      className="text-xs font-normal text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Solid Dark Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 mt-2 rounded-lg bg-[#18181B] hover:bg-black active:scale-[0.99] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Please wait...</span>
                </>
              ) : (
                <span>
                  {currentView === 'login' && 'Continue with Email'}
                  {currentView === 'signup' && 'Continue with Email'}
                  {currentView === 'forgot' && 'Send Recovery Link'}
                </span>
              )}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <div className="mt-5 text-center text-xs text-slate-500">
            {currentView === 'login' && (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToSignup}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            )}

            {currentView === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            )}

            {currentView === 'forgot' && (
              <p>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  Back to Log in
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Spacer */}
      <footer className="relative z-10 h-6 sm:h-10 w-full" />
    </div>
  );
}


