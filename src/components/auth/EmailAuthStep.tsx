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
        <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#FFFFFF] flex items-center justify-center shrink-0">
          <Mail size={20} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {currentMode === 'login' ? 'Email Sign In' : 'Create Account'}
        </h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        {currentMode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Rahul Sharma"
                value={fullName}
                onChange={handleFullNameInputChange}
                className="w-full pl-10 pr-4 h-11 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-gray-900 font-normal placeholder:text-gray-400"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={handleEmailInputChange}
              className="w-full pl-10 pr-4 h-11 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-gray-900 font-normal placeholder:text-gray-400"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-900">
              Password
            </label>
            {currentMode === 'login' && (
              <button
                type="button"
                onClick={onForgotPasswordClick}
                className="text-xs text-gray-700 hover:underline font-semibold cursor-pointer"
              >
                Forgot?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              required
              placeholder="••••••••"
              minLength={6}
              value={password}
              onChange={handlePasswordInputChange}
              className="w-full pl-10 pr-11 h-11 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-gray-900 font-normal placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={onTogglePasswordVisibility}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1 cursor-pointer"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-lg font-semibold text-black text-sm bg-white hover:bg-gray-50 border border-gray-300 hover:border-black active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 mt-2 flex items-center justify-center gap-2 shadow-xs"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : (
            <span>{currentMode === 'login' ? 'Sign In' : 'Create Account'}</span>
          )}
        </button>
      </form>
    </div>
  );
}
