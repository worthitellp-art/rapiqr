import React from 'react';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';

interface ForgotPasswordFormProps {
  identifier: string;
  isSubmitting: boolean;
  onIdentifierChange: (value: string) => void;
  onBackToLogin: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export default function ForgotPasswordForm({
  identifier,
  isSubmitting,
  onIdentifierChange,
  onBackToLogin,
  onSubmit,
}: ForgotPasswordFormProps) {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onIdentifierChange(event.target.value);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#FFFFFF] flex items-center justify-center shrink-0">
          <Mail size={20} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 pt-2">
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
              value={identifier}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 h-11 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-gray-900 font-normal placeholder:text-gray-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-lg font-semibold text-black text-sm bg-white hover:bg-gray-50 border border-gray-300 hover:border-black active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 mt-2 flex items-center justify-center gap-2 shadow-xs"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <span>Send Reset Link</span>}
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-center text-xs text-gray-500 hover:text-gray-900 font-medium pt-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Log In</span>
        </button>
      </form>
    </div>
  );
}
