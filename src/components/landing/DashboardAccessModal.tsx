import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import { FlowButton } from '../ui/flow-button';
import { useAuth } from '../../context/AuthContext';
import { sendMsg91Otp, verifyMsg91Otp, retryMsg91Otp, toMsg91Identifier } from '../../lib/msg91Widget';
import {
  checkOtpRateLimit,
  recordOtpSendAttempt,
  recordOtpVerifyFailure,
  clearOtpRateLimit,
  formatRemainingTime,
  MAX_OTP_ATTEMPTS,
} from '../../lib/otpRateLimit';
import { useOtpLock } from '../../lib/useOtpLock';

const sendLockedMessage = (time: string) =>
  `You've used all ${MAX_OTP_ATTEMPTS} code requests. For your security, new codes are locked for 4 hours — try again in ${time}.`;
const verifyLockedMessage = (time: string) =>
  `Too many incorrect codes (${MAX_OTP_ATTEMPTS}/${MAX_OTP_ATTEMPTS}). For your security, verification is locked for 4 hours — try again in ${time}.`;

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

  const activePhone = phoneNumber || phoneDigits;

  // sendLockMs: no more codes can be requested. verifyLockMs: no more guesses
  // (and no new codes either — sendLockMs covers that case too).
  const { sendLockMs, verifyLockMs, refresh: refreshLock } = useOtpLock(activePhone);
  const bannerLockMs = step === 'otp' ? verifyLockMs : sendLockMs;

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

    const finalPhone = phoneNumber || phoneDigits;
    const rateStatus = checkOtpRateLimit(finalPhone, 'send');
    if (rateStatus.isLocked) {
      refreshLock();
      setErrorMessage(rateStatus.verifyAttempts >= MAX_OTP_ATTEMPTS
        ? verifyLockedMessage(rateStatus.remainingTimeStr)
        : sendLockedMessage(rateStatus.remainingTimeStr));
      return;
    }

    setIsSubmitting(true);
    try {
      const preflight = await sendPhoneLoginOtp(finalPhone);
      if (!preflight.success) {
        setErrorMessage(preflight.error || 'Failed to send verification code.');
        return;
      }
      await sendMsg91Otp(toMsg91Identifier(finalPhone));

      // The 3rd code is still valid, so move on to the OTP step either way —
      // only further requests get locked.
      recordOtpSendAttempt(finalPhone);
      refreshLock();
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

    const finalPhone = phoneNumber || phoneDigits;
    const rateStatus = checkOtpRateLimit(finalPhone, 'verify');
    if (rateStatus.isLocked) {
      refreshLock();
      setErrorMessage(verifyLockedMessage(rateStatus.remainingTimeStr));
      return;
    }

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
        const failResult = recordOtpVerifyFailure(finalPhone);
        refreshLock();
        if (failResult.isLocked) {
          setErrorMessage(verifyLockedMessage(failResult.remainingTimeStr));
        } else {
          const remainingTries = MAX_OTP_ATTEMPTS - failResult.attempts;
          setErrorMessage(
            `${result.error || 'Verification failed.'} (${remainingTries} attempt${remainingTries !== 1 ? 's' : ''} left before 4-hour lock)`
          );
        }
        return;
      }
      clearOtpRateLimit(finalPhone);
      onSuccess();
      onClose();
    } catch (err: any) {
      const failResult = recordOtpVerifyFailure(finalPhone);
      refreshLock();
      if (failResult.isLocked) {
        setErrorMessage(verifyLockedMessage(failResult.remainingTimeStr));
      } else {
        const remainingTries = MAX_OTP_ATTEMPTS - failResult.attempts;
        setErrorMessage(
          `${err.message || 'Incorrect code — please try again.'} (${remainingTries} attempt${remainingTries !== 1 ? 's' : ''} left before 4-hour lock)`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting || sendLockMs > 0) return;
    setErrorMessage(null);

    const finalPhone = phoneNumber || phoneDigits;
    const rateStatus = checkOtpRateLimit(finalPhone, 'send');
    if (rateStatus.isLocked) {
      refreshLock();
      setErrorMessage(sendLockedMessage(rateStatus.remainingTimeStr));
      return;
    }

    setIsSubmitting(true);
    try {
      // Try MSG91's retryOtp first (reuses the live request); if the widget has
      // no active request, errors, or never answers, start a fresh send instead.
      try {
        await retryMsg91Otp('text');
      } catch (retryErr) {
        console.warn('retryMsg91Otp failed, falling back to a fresh send:', retryErr);
        const preflight = await sendPhoneLoginOtp(finalPhone);
        if (!preflight.success) throw new Error(preflight.error || 'Failed to resend the code.');
        await sendMsg91Otp(toMsg91Identifier(finalPhone));
      }

      recordOtpSendAttempt(finalPhone);
      refreshLock();
      setOtpCode('');
      setCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[510] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100/80 p-7 sm:p-8 space-y-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer" aria-label="Close">
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="w-13 h-13 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3.5">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Access Your Dashboard</h2>
          <p className="mt-1.5 text-xs text-slate-500">
            {step === 'phone'
              ? 'Verify your number — your tag is already linked to it.'
              : `Enter the code sent to ${phoneNumber}`}
          </p>
        </div>

        {bannerLockMs > 0 && (
          <div className="p-3.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold">Locked for 4 hours</p>
              <p className="text-[11.5px] text-amber-800 mt-0.5">
                {step === 'otp'
                  ? `${MAX_OTP_ATTEMPTS} incorrect codes entered.`
                  : `${MAX_OTP_ATTEMPTS} attempts used.`}{' '}
                Try again in <span className="font-bold font-mono">{formatRemainingTime(bannerLockMs)}</span>.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
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
            <FlowButton
              type="submit"
              fullWidth
              loading={isSubmitting}
              disabled={phoneDigits.length < 10 || sendLockMs > 0}
            >
              {sendLockMs > 0 ? `Locked · ${formatRemainingTime(sendLockMs)}` : 'Send Verification Code'}
            </FlowButton>
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
              disabled={verifyLockMs > 0}
              className="w-full text-center tracking-[0.4em] font-mono text-xl h-12 rounded-md border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-gray-900 placeholder:text-gray-300 disabled:bg-gray-100"
            />
            <FlowButton
              type="submit"
              fullWidth
              loading={isSubmitting}
              disabled={!otpCode.trim() || verifyLockMs > 0}
            >
              {verifyLockMs > 0 ? `Locked (${formatRemainingTime(verifyLockMs)})` : 'Verify & Continue'}
            </FlowButton>
            <div className="flex items-center justify-between pt-1 text-xs">
              <button type="button" onClick={() => { setStep('phone'); setOtpCode(''); setErrorMessage(null); }} className="text-gray-500 hover:text-black font-medium transition-colors cursor-pointer">
                Change phone number
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isSubmitting || sendLockMs > 0}
                className="text-gray-700 hover:text-black font-semibold transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>
                  {sendLockMs > 0
                    ? `No more codes · ${formatRemainingTime(sendLockMs)}`
                    : countdown > 0
                    ? `Resend in ${countdown}s`
                    : 'Resend code'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
