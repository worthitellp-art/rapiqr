import React from 'react';
import { Smartphone, ShieldCheck, ArrowRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';

export interface PhoneVerificationCardProps {
  linkingPhone: string;
  setLinkingPhone: (phone: string) => void;
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpStep: 'input' | 'verify';
  setOtpStep: (step: 'input' | 'verify') => void;
  linkingLoading: boolean;
  linkingMessage: { type: 'success' | 'error'; text: string } | null;
  setLinkingMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  handleSendPhoneVerification: (e: React.FormEvent) => void;
  handleConfirmPhoneOtp: (e: React.FormEvent) => void;
  onBack: () => void;
  handleSignOut: () => void;
}

export default function PhoneVerificationCard({
  linkingPhone,
  setLinkingPhone,
  otpCode,
  setOtpCode,
  otpStep,
  setOtpStep,
  linkingLoading,
  linkingMessage,
  setLinkingMessage,
  handleSendPhoneVerification,
  handleConfirmPhoneOtp,
  onBack,
  handleSignOut,
}: PhoneVerificationCardProps) {
  const handlePhoneInputChange = (phoneNumber: string) => {
    setLinkingPhone(phoneNumber);
    setLinkingMessage(null);
  };

  const handleOtpInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnlyValue = event.target.value.replace(/\D/g, '');
    setOtpCode(numericOnlyValue);
    setLinkingMessage(null);
  };

  const handleReturnToPhoneStep = () => {
    setOtpStep('input');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 font-body relative">
      {/* ── Minimal Clean Card Box ── */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-200/70 shadow-xl p-7 sm:p-8 space-y-6 animate-fade-in text-center z-10">
        
        {/* ── Top Minimal Icon Badge ── */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
          <Smartphone size={26} className="text-amber-600" />
        </div>

        {/* ── Header Title ── */}
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900 tracking-tight">
            Verify Phone Number
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            Enter the verification code sent to your phone to access your dashboard.
          </p>
        </div>

        {/* ── Feedback Message Banner ── */}
        {linkingMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-left animate-fade-in ${
              linkingMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                : 'bg-rose-50 text-rose-700 border border-rose-200/70'
            }`}
          >
            {linkingMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle size={16} className="shrink-0 text-rose-500" />
            )}
            <span>{linkingMessage.text}</span>
          </div>
        )}

        {/* ── Step 1: Phone Number Input ── */}
        {otpStep === 'input' ? (
          <form onSubmit={handleSendPhoneVerification} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Phone Number
              </label>
              <PhoneInputWithCountry
                value={linkingPhone}
                onChange={handlePhoneInputChange}
                placeholder="10-digit mobile number"
              />
            </div>

            <button
              type="submit"
              disabled={linkingLoading || !linkingPhone.trim()}
              className="w-full py-4 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {linkingLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ── Step 2: OTP Verification ── */
          <form onSubmit={handleConfirmPhoneOtp} className="space-y-4 text-left">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Enter 6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={handleReturnToPhoneStep}
                  className="text-xs text-amber-600 font-bold hover:underline cursor-pointer transition-colors"
                >
                  Change Phone
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={handleOtpInputChange}
                placeholder="0 0 0 0 0 0"
                className="w-full h-14 text-center text-2xl tracking-[10px] font-mono font-semibold bg-slate-50 border-2 border-amber-500 focus:border-amber-600 focus:ring-4 focus:ring-amber-500/15 rounded-xl outline-none text-slate-900 shadow-2xs transition-all placeholder:text-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={linkingLoading || !otpCode.trim()}
              className="w-full py-4 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {linkingLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} className="text-white" />
                  <span>Verify &amp; Access Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Card Footer Actions ── */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={onBack}
            className="text-slate-500 hover:text-slate-900 font-bold transition-colors cursor-pointer"
          >
            ← Back to Home
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
