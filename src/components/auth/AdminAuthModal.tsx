import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, ShieldAlert, ShieldCheck, ArrowRight, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import { sendMsg91Otp, verifyMsg91Otp, retryMsg91Otp, toMsg91Identifier } from '../../lib/msg91Widget';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * The ONLY entry point into the admin dashboard (secret /admin route). Restricted
 * server-side to a single phone number (ADMIN_PHONE in Server/.env) — this modal
 * itself never knows or checks that number, it just forwards to the backend.
 */
export default function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const { sendAdminPhoneOtp, verifyAdminPhoneOtp } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) {
    return null;
  }

  const resetToPhoneStep = () => {
    setStep('phone');
    setOtpCode('');
    setErrorMessage(null);
  };

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (phoneDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend pre-flight — rejects every number except the one authorized
      // admin phone before we ever ask MSG91 to send a code.
      const preflight = await sendAdminPhoneOtp(phoneNumber);
      if (!preflight.success) {
        setErrorMessage(preflight.error || 'This number is not authorized for admin access.');
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
    if (cleanOtp.length < 4) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const accessToken = await verifyMsg91Otp(cleanOtp);
      const result = await verifyAdminPhoneOtp(phoneNumber, accessToken);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid admin credentials.');
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
    <div
      className="fixed inset-0 z-[510] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100/80 p-8 space-y-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="w-13 h-13 rounded-2xl bg-[#F5F5F5] border border-[#111111]/40 text-[#111111] flex items-center justify-center mx-auto mb-3.5">
            <ShieldAlert size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Admin Access
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            {step === 'phone'
              ? 'Sign in with the authorized admin phone number.'
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
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Admin mobile number
              </label>
              <PhoneInputWithCountry
                value={phoneNumber}
                onChange={(full, digits) => { setPhoneNumber(full); setPhoneDigits(digits); }}
                placeholder="10-digit mobile number"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || phoneDigits.length < 10}
              className="w-full h-11 rounded-lg font-semibold text-black text-sm flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 hover:border-black active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter code"
                autoFocus
                className="w-full text-center tracking-[0.4em] font-mono text-xl h-12 rounded-lg border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-gray-900 placeholder:text-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpCode.trim().length < 4}
              className="w-full h-11 rounded-lg font-semibold text-black text-sm flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 hover:border-black active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Verify &amp; Sign In</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button type="button" onClick={resetToPhoneStep} className="text-gray-500 hover:text-black font-medium transition-colors cursor-pointer">
                Change phone number
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isSubmitting}
                className="text-gray-700 hover:text-black font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
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
