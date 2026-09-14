import React from 'react';
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';

interface EmailOtpStepProps {
  email: string;
  otpCode: string;
  otpSent: boolean;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onOtpCodeChange: (value: string) => void;
  onBackToList: () => void;
  onSendCode: (event: React.FormEvent) => void;
  onVerifyCode: (event: React.FormEvent) => void;
}

export default function EmailOtpStep({
  email,
  otpCode,
  otpSent,
  isSubmitting,
  onEmailChange,
  onOtpCodeChange,
  onBackToList,
  onSendCode,
  onVerifyCode,
}: EmailOtpStepProps) {
  const handleEmailInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(event.target.value);
  };

  const handleOtpInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onOtpCodeChange(event.target.value.replace(/\D/g, ''));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        type="button"
        onClick={onBackToList}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Back to options</span>
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F6C000] text-[#4A3900] flex items-center justify-center shrink-0">
          <KeyRound size={20} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Sign In with a Code</h3>
      </div>

      {!otpSent ? (
        <form onSubmit={onSendCode} className="space-y-4 pt-2">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            No password needed — we'll email you a 6-digit code.
          </p>
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
                className="w-full pl-10 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#F6C000] focus:ring-2 focus:ring-[#F6C000]/25 transition-all text-slate-900 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl font-bold text-[#4A3900] text-sm bg-[#F6C000] hover:bg-[#E0AE00] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Code</span>}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerifyCode} className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enter 6-Digit Code
            </label>
            <button
              type="button"
              onClick={onSendCode}
              disabled={isSubmitting}
              className="text-xs text-[#A16207] hover:underline font-bold cursor-pointer disabled:opacity-60"
            >
              Resend
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            autoFocus
            placeholder="0 0 0 0 0 0"
            value={otpCode}
            onChange={handleOtpInputChange}
            className="w-full h-14 text-center text-2xl tracking-[10px] font-mono font-semibold bg-slate-50 border-2 border-[#F6C000] focus:border-[#E0AE00] focus:ring-4 focus:ring-[#F6C000]/20 rounded-2xl outline-none text-slate-900 transition-all placeholder:text-slate-300"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl font-bold text-[#4A3900] text-sm bg-[#F6C000] hover:bg-[#E0AE00] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Verify &amp; Sign In</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
