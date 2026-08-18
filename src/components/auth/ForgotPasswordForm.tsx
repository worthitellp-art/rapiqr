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
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Mail size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
          <p className="text-xs text-slate-500 font-medium">We'll email you a secure reset link</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Registered Email Address
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={identifier}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-slate-900 font-medium placeholder:text-slate-400"
            />
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
              <span className="text-xs font-bold tracking-wider uppercase">Sending Reset Link...</span>
            </>
          ) : (
            <span>Send Password Reset Link</span>
          )}
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
