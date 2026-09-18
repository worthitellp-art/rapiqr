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
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={identifier}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/25 transition-all text-slate-900 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl font-bold text-[#FFFFFF] text-sm bg-[#111111] hover:bg-[#000000] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Link</span>}
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-center text-xs text-slate-600 hover:text-slate-900 font-bold pt-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Log In</span>
        </button>
      </form>
    </div>
  );
}
