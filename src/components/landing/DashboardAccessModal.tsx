import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, ArrowRight, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import { useAuth } from '../../context/AuthContext';
import { sendMsg91Otp, verifyMsg91Otp, retryMsg91Otp, toMsg91Identifier } from '../../lib/msg91Widget';

interface DashboardAccessModalProps {
  isOpen: boolean;
  /** Pre-filled with the phone number just entered at checkout — the order was
      already linked to it server-side, so this is usually just one OTP away. */
  initialPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Lets a guest buyer who just completed checkout get into their (already
 * auto-created) Client Dashboard with nothing but their phone number + OTP —
 * no separate signup form, since the account already exists server-side.
 */
export default function DashboardAccessModal({ isOpen, initialPhone, onClose, onSuccess }: DashboardAccessModalProps) {
  const { sendPhoneLoginOtp, verifyPhoneLoginOtp } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState(initialPhone ? `+91 ${initialPhone.replace(/\D/g, '').slice(-10)}` : '');
  const [phoneDigits, setPhoneDigits] = useState(initialPhone.replace(/\D/g, '').slice(-10));
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (phoneDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const preflight = await sendPhoneLoginOtp(phoneNumber);
      if (!preflight.success) {
        setErrorMessage(preflight.error || 'Failed to send verification code.');
        return;
      }
      await sendMsg91Otp(toMsg91Identifier(phoneNumber));
      setStep('otp');
      setCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setErrorMessage('Please enter the verification code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const accessToken = await verifyMsg91Otp(cleanOtp);
      const result = await verifyPhoneLoginOtp(phoneNumber, accessToken);
      if (!result.success) {
        setErrorMessage(result.error || 'Verification failed. Please try again.');
        return;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect code — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting) return;
    setErrorMessage(null);
    try {
      await retryMsg91Otp();
      setCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend the code.');
    }
  };

  return (
    <div className="fixed inset-0 z-[510] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100/80 p-7 sm:p-8 space-y-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer" aria-label="Close">
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3.5">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Access Your Dashboard</h2>
          <p className="mt-1.5 text-xs text-slate-500">
            {step === 'phone'
              ? 'Verify your number — your tag is already linked to it.'
              : `Enter the code sent to ${phoneNumber}`}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <PhoneInputWithCountry
              value={phoneNumber}
              onChange={(full, digits) => { setPhoneNumber(full); setPhoneDigits(digits); }}
              placeholder="10-digit mobile number"
            />
            <button
              type="submit"
              disabled={isSubmitting || phoneDigits.length < 10}
              className="w-full h-11 rounded-lg font-semibold text-black text-sm flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 hover:border-black active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <><span>Send Verification Code</span><ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter code"
              autoFocus
              className="w-full text-center tracking-[0.4em] font-mono text-xl h-12 rounded-lg border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-gray-900 placeholder:text-gray-300"
            />
            <button
              type="submit"
              disabled={isSubmitting || !otpCode.trim()}
              className="w-full h-11 rounded-lg font-semibold text-black text-sm flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 hover:border-black active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <><ShieldCheck size={16} /><span>Verify &amp; Continue</span></>}
            </button>
            <div className="flex items-center justify-between pt-1 text-xs">
              <button type="button" onClick={() => { setStep('phone'); setOtpCode(''); setErrorMessage(null); }} className="text-gray-500 hover:text-black font-medium transition-colors cursor-pointer">
                Change phone number
              </button>
              <button type="button" onClick={handleResendOtp} disabled={countdown > 0 || isSubmitting} className="text-gray-700 hover:text-black font-semibold transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1">
                <RotateCcw size={12} />
                <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
