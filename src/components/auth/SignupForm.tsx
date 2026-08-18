import React from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';

interface SignupFormProps {
  fullName: string;
  identifier: string;
  signupPhone: string;
  password: string;
  isPasswordVisible: boolean;
  isSubmitting: boolean;
  onFullNameChange: (value: string) => void;
  onIdentifierChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export default function SignupForm({
  fullName,
  identifier,
  signupPhone,
  password,
  isPasswordVisible,
  isSubmitting,
  onFullNameChange,
  onIdentifierChange,
  onPhoneChange,
  onPasswordChange,
  onTogglePasswordVisibility,
  onSubmit,
}: SignupFormProps) {
  const handleFullNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFullNameChange(event.target.value);
  };

  const handleIdentifierInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onIdentifierChange(event.target.value);
  };

  const handlePasswordInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPasswordChange(event.target.value);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          Full Name
        </label>
        <input
          type="text"
          required
          placeholder="Mihir Rathod"
          value={fullName}
          onChange={handleFullNameInputChange}
          className="w-full px-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-slate-900 font-medium placeholder:text-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          Email Address
        </label>
        <input
          type="email"
          required
          placeholder="name@example.com"
          value={identifier}
          onChange={handleIdentifierInputChange}
          className="w-full px-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-slate-900 font-medium placeholder:text-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          Phone Number
        </label>
        <PhoneInputWithCountry value={signupPhone} onChange={onPhoneChange} />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          Password
        </label>
        <div className="relative">
          <input
            type={isPasswordVisible ? 'text' : 'password'}
            required
            placeholder="••••••••"
            minLength={6}
            value={password}
            onChange={handlePasswordInputChange}
            className="w-full pl-4 pr-12 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-slate-900 font-medium placeholder:text-slate-400"
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
            <span className="text-xs font-bold tracking-wider uppercase">Creating Account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </button>
    </form>
  );
}
