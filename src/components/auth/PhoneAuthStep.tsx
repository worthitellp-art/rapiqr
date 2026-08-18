import React from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Smartphone, User } from 'lucide-react';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import { AuthMode } from './hooks/useAuthForm';

interface PhoneAuthStepProps {
  currentMode: AuthMode;
  phone: string;
  fullName: string;
  password: string;
  isPasswordVisible: boolean;
  isSubmitting: boolean;
  onPhoneChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onBackToList: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export default function PhoneAuthStep({
  currentMode,
  phone,
  fullName,
  password,
  isPasswordVisible,
  isSubmitting,
  onPhoneChange,
  onFullNameChange,
  onPasswordChange,
  onTogglePasswordVisibility,
  onBackToList,
  onSubmit,
}: PhoneAuthStepProps) {
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
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Smartphone size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {currentMode === 'login' ? 'Phone Number Sign In' : 'Create Phone Account'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Enter your mobile phone number to sign in or register
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
                className="w-full pl-10 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-slate-900 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Mobile Phone Number
          </label>
          <PhoneInputWithCountry value={phone} onChange={onPhoneChange} />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              required
              placeholder="••••••••"
              minLength={6}
              value={password}
              onChange={handlePasswordInputChange}
              className="w-full pl-10 pr-12 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-slate-900 font-medium placeholder:text-slate-400"
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
            <span>{currentMode === 'login' ? 'Sign In with Phone' : 'Create Phone Account'}</span>
          )}
        </button>
      </form>
    </div>
  );
}
