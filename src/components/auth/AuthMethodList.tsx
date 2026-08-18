import React from 'react';
import { Mail, Smartphone, ChevronRight } from 'lucide-react';
import { AuthMode, AuthStep } from './hooks/useAuthForm';

interface AuthMethodListProps {
  currentMode: AuthMode;
  isSubmitting: boolean;
  onSelectMode: (mode: AuthMode) => void;
  onSelectStep: (step: AuthStep) => void;
  onGoogleSignIn: () => void;
}

export default function AuthMethodList({
  currentMode,
  isSubmitting,
  onSelectMode,
  onSelectStep,
  onGoogleSignIn,
}: AuthMethodListProps) {
  const handleSelectEmailStep = () => {
    onSelectStep('email');
  };

  const handleSelectPhoneStep = () => {
    onSelectStep('phone');
  };

  const handleLoginTabClick = () => {
    onSelectMode('login');
  };

  const handleSignupTabClick = () => {
    onSelectMode('signup');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Log In / Create Account Switcher — sliding pill indicator */}
      <div className="relative flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
        <div
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-slate-900 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: currentMode === 'signup' ? 'translateX(100%)' : 'translateX(0)' }}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={handleLoginTabClick}
          className={`relative flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-colors duration-200 cursor-pointer ${
            currentMode === 'login' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={handleSignupTabClick}
          className={`relative flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-colors duration-200 cursor-pointer ${
            currentMode === 'signup' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Clean Minimal Method List */}
      <div className="space-y-3">
        {/* Email Option */}
        <button
          type="button"
          onClick={handleSelectEmailStep}
          className="w-full p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-2xs hover:shadow-md active:scale-[0.99] active:translate-y-0"
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Mail size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-slate-900">
                Continue with Email
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {currentMode === 'login' ? 'Sign in using email & password' : 'Register with your email address'}
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-800 transition-colors" />
        </button>

        {/* Phone Number Option */}
        <button
          type="button"
          onClick={handleSelectPhoneStep}
          className="w-full p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-2xs hover:shadow-md active:scale-[0.99] active:translate-y-0"
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Continue with Phone Number
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {currentMode === 'login' ? 'Sign in using mobile number' : 'Register with mobile phone number'}
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-800 transition-colors" />
        </button>

        {/* Google Quick Sign-In Option */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onGoogleSignIn}
          className="w-full p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-60"
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Continue with Google
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Fast & secure 1-click Google authentication
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-800 transition-colors" />
        </button>
      </div>
    </div>
  );
}
