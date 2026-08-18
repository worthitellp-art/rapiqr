import React from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { AuthMode } from './hooks/useAuthForm';

interface EmailAuthStepProps {
  currentMode: AuthMode;
  email: string;
  fullName: string;
  password: string;
  isPasswordVisible: boolean;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onForgotPasswordClick: () => void;
  onBackToList: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export default function EmailAuthStep({
  currentMode,
  email,
  fullName,
  password,
  isPasswordVisible,
  isSubmitting,
  onEmailChange,
  onFullNameChange,
  onPasswordChange,
  onTogglePasswordVisibility,
  onForgotPasswordClick,
  onBackToList,
  onSubmit,
}: EmailAuthStepProps) {
  const handleEmailInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(event.target.value);
  };

  const handleFullNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFullNameChange(event.target.value);
  };

  const handlePasswordInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPasswordChange(event.target.value);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Step Navigation Header */}
      <button
        type="button"
        onClick={onBackToList}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Back to options</span>
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
          <Mail size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {currentMode === 'login' ? 'Email Sign In' : 'Create Email Account'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {currentMode === 'login' ? 'Enter your email and password' : 'Enter your name, email, and password'}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        {currentMode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Mihir Rathod"
                value={fullName}
                onChange={handleFullNameInputChange}
                className="w-full pl-10 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all text-slate-900 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={handleEmailInputChange}
              className="w-full pl-10 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all text-slate-900 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            {currentMode === 'login' && (
              <button
                type="button"
                onClick={onForgotPasswordClick}
                className="text-xs text-amber-600 hover:underline font-bold cursor-pointer"
              >
                Forgot?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              required
              placeholder="••••••••"
              minLength={6}
              value={password}
              onChange={handlePasswordInputChange}
              className="w-full pl-10 pr-12 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all text-slate-900 font-medium placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={onTogglePasswordVisibility}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl font-bold text-white text-sm bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition-all duration-200 shadow-md cursor-pointer disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span className="text-xs font-bold tracking-wider uppercase">Processing...</span>
            </>
          ) : (
            <span>{currentMode === 'login' ? 'Sign In with Email' : 'Create Email Account'}</span>
          )}
        </button>
      </form>
    </div>
  );
}
