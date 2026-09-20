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
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#111111] shadow-2xs">
          <Smartphone size={26} className="text-[#111111]" />
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
              <label className="block text-sm font-medium text-gray-900 mb-2">
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
              className="w-full h-11 px-5 rounded-lg bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-black font-semibold text-sm shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {linkingLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-black" />
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-900">
                  Enter OTP Code
                </label>
                <button
                  type="button"
                  onClick={handleReturnToPhoneStep}
                  className="text-xs text-gray-700 font-semibold hover:underline cursor-pointer transition-colors"
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
                placeholder="Enter code"
                className="w-full h-12 text-center text-xl tracking-[8px] font-mono font-semibold bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black rounded-lg outline-none text-gray-900 shadow-xs transition-all placeholder:text-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={linkingLoading || !otpCode.trim()}
              className="w-full h-11 px-5 rounded-lg bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-black font-semibold text-sm shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {linkingLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-black" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} className="text-black" />
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
