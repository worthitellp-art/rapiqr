import React, { useState, useEffect } from 'react';
import AppLogo from '../common/AppLogo';
import AuthHeroVisual from './AuthHeroVisual';
import MinimalInput from './MinimalInput';
import SocialAuthButton from './SocialAuthButton';
import AuthAlertMessage from './AuthAlertMessage';
import { useAuthForm } from './hooks/useAuthForm';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  prefillEmail?: string;
  onBackHome: () => void;
  onSuccess: () => void;
}

export default function AuthPage({
  initialMode = 'login',
  prefillEmail = '',
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

  useEffect(() => {
    if (initialMode) {
      setCurrentView(initialMode);
      switchAuthMode(initialMode);
    }
  }, [initialMode]);

  const handleSwitchToLogin = () => {
    setCurrentView('login');
    switchAuthMode('login');
  };

  const handleSwitchToSignup = () => {
    setCurrentView('signup');
    switchAuthMode('signup');
  };

  const handleSwitchToForgot = () => {
    setCurrentView('forgot');
  };

  const handleFormSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentView === 'forgot') {
      await handlePasswordResetSubmit(event);
    } else {
      await handleEmailSubmit(event);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex font-display text-slate-900 selection:bg-amber-400 selection:text-black">
      {/* Left Half: Clean Visual Panel (Desktop) */}
      <div className="hidden lg:block lg:w-[48%] xl:w-[50%] h-screen sticky top-0 overflow-hidden">
        <AuthHeroVisual />
      </div>

      {/* Right Half: Full Page Minimalist Auth */}
      <div className="w-full lg:w-[52%] xl:w-[50%] min-h-screen flex flex-col justify-between p-8 sm:p-12 md:p-16 xl:p-20 overflow-y-auto bg-white">
        {/* Top Bar: Back & Logo */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-between pb-8">
          <button
            type="button"
            onClick={onBackHome}
            className="text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
          >
            ← Back to Home
          </button>
          <AppLogo variant="light" className="h-8 w-auto object-contain" />
        </div>

        {/* Center: Minimal Form Container */}
        <div className="w-full max-w-sm mx-auto my-auto py-6">
          {/* Exactly 2 Text Lines: Headline + Subtitle */}
          <div className="mb-8 space-y-1.5 text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              {currentView === 'login' && 'Sign in'}
              {currentView === 'signup' && 'Create account'}
              {currentView === 'forgot' && 'Reset password'}
            </h1>
            <p className="text-slate-500 text-sm">
              {currentView === 'login' && 'Enter your details to access your dashboard.'}
              {currentView === 'signup' && 'Enter your details to get started with RapiQR.'}
              {currentView === 'forgot' && 'Enter your email to receive a reset link.'}
            </p>
          </div>

          {/* Google Sign In (Only on login / signup) */}
          {currentView !== 'forgot' && (
            <div className="space-y-5 mb-6">
              <SocialAuthButton
                onGoogleSignIn={handleGoogleAuthentication}
                isSubmitting={isSubmitting}
              />

              {/* Minimal Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Or continue with email
                </span>
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          <AuthAlertMessage errorMessage={errorMessage} successMessage={successMessage} />

          {/* Inputs Form */}
          <form onSubmit={handleFormSubmission} className="space-y-4 text-left">
            {currentView === 'signup' && (
              <MinimalInput
                id="fullName"
                label="Full Name"
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
              label="Email Address"
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
              <div className="space-y-1.5">
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
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSwitchToForgot}
                      className="text-xs font-semibold text-slate-700 hover:text-black transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Solid Black Primary Action Button matching sccanpagedesign.png & designformscanpage.png */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-2 rounded-xl bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="text-sm">Please wait...</span>
              ) : (
                <span>
                  {currentView === 'login' && 'Sign In'}
                  {currentView === 'signup' && 'Get Started'}
                  {currentView === 'forgot' && 'Send Reset Link'}
                </span>
              )}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <div className="mt-8 text-center text-sm text-slate-500">
            {currentView === 'login' && (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToSignup}
                  className="font-bold text-black hover:underline transition-colors cursor-pointer"
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
                  className="font-bold text-black hover:underline transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}

            {currentView === 'forgot' && (
              <p>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="font-bold text-black hover:underline transition-colors cursor-pointer"
                >
                  Back to Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Empty placeholder for clean spacing balance */}
        <div className="w-full max-w-sm mx-auto" />
      </div>
    </div>
  );
}
