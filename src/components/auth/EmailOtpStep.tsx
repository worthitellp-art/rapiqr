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
        <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#FFFFFF] flex items-center justify-center shrink-0">
          <KeyRound size={20} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Sign In with a Code</h3>
      </div>

      {!otpSent ? (
        <form onSubmit={onSendCode} className="space-y-4 pt-2">
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            No password needed — we'll email you a 6-digit code.
          </p>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg font-semibold text-black text-sm bg-white hover:bg-gray-50 border border-gray-300 hover:border-black active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 mt-2 flex items-center justify-center gap-2 shadow-xs"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <span>Send Code</span>}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerifyCode} className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-900">
              Enter 6-Digit Code
            </label>
            <button
              type="button"
              onClick={onSendCode}
              disabled={isSubmitting}
              className="text-xs text-gray-700 hover:underline font-semibold cursor-pointer disabled:opacity-60"
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
            placeholder="000000"
            value={otpCode}
            onChange={handleOtpInputChange}
            className="w-full h-12 text-center text-xl tracking-[8px] font-mono font-semibold bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black rounded-lg outline-none text-gray-900 transition-all placeholder:text-gray-300"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg font-semibold text-black text-sm bg-white hover:bg-gray-50 border border-gray-300 hover:border-black active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 mt-2 flex items-center justify-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <>
                <ShieldCheck size={18} className="text-black" />
                <span>Verify &amp; Sign In</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
