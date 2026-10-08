import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import { FlowButton } from '../ui/flow-button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { joinUsTranslations } from '../../i18n/joinUsTranslations';
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

interface DashboardAccessModalProps {
  isOpen: boolean;
  /** Pre-filled with the phone number just entered at checkout — the order was
      already linked to it server-side, so this is usually just one OTP away. */
  initialPhone: string;
  initialName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Lets a guest buyer who just completed checkout get into their (already
 * auto-created) Client Dashboard with nothing but their phone number + OTP —
 * no separate signup form, since the account already exists server-side.
 */
export default function DashboardAccessModal({ isOpen, initialPhone, initialName = '', onClose, onSuccess }: DashboardAccessModalProps) {
  const { sendPhoneLoginOtp, verifyPhoneLoginOtp } = useAuth();
  const { language } = useLanguage();
  const t = joinUsTranslations[language].dashboardAccessModal;

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [fullName, setFullName] = useState(initialName || '');
  const [phoneNumber, setPhoneNumber] = useState(initialPhone ? `+91 ${initialPhone.replace(/\D/g, '').slice(-10)}` : '');
  const [phoneDigits, setPhoneDigits] = useState(initialPhone.replace(/\D/g, '').slice(-10));
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (initialName && !fullName) {
      setFullName(initialName);
    }
  }, [initialName]);

  useEffect(() => {
    if (initialPhone) {
      setPhoneNumber(`+91 ${initialPhone.replace(/\D/g, '').slice(-10)}`);
      setPhoneDigits(initialPhone.replace(/\D/g, '').slice(-10));
    }
  }, [initialPhone]);

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

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    if (phoneDigits.length < 10) {
      setErrorMessage(t.invalidPhone);
      return;
    }

    const finalPhone = phoneNumber || phoneDigits;
    const rateStatus = checkOtpRateLimit(finalPhone, 'send');
    if (rateStatus.isLocked) {
      refreshLock();
      setErrorMessage(rateStatus.verifyAttempts >= MAX_OTP_ATTEMPTS
        ? t.verifyLockedMessage(MAX_OTP_ATTEMPTS, rateStatus.remainingTimeStr)
        : t.sendLockedMessage(MAX_OTP_ATTEMPTS, rateStatus.remainingTimeStr));
      return;
    }

    setIsSubmitting(true);
    try {
      const preflight = await sendPhoneLoginOtp(finalPhone);
      if (!preflight.success) {
        setErrorMessage(preflight.error || t.sendFailed);
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
      setErrorMessage(err.message || t.sendFailed);
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
      setErrorMessage(t.verifyLockedMessage(MAX_OTP_ATTEMPTS, rateStatus.remainingTimeStr));
      return;
    }

    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setErrorMessage(t.pleaseEnterCode);
      return;
    }
    setIsSubmitting(true);
    try {
      const accessToken = await verifyMsg91Otp(cleanOtp);
      const result = await verifyPhoneLoginOtp(phoneNumber, accessToken, fullName.trim());
      if (!result.success) {
        const failResult = recordOtpVerifyFailure(finalPhone);
        refreshLock();
        if (failResult.isLocked) {
          setErrorMessage(t.verifyLockedMessage(MAX_OTP_ATTEMPTS, failResult.remainingTimeStr));
        } else {
          const remainingTries = MAX_OTP_ATTEMPTS - failResult.attempts;
          setErrorMessage(
            `${result.error || t.verificationFailed}${t.attemptsLeftSuffix(remainingTries)}`
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
        setErrorMessage(t.verifyLockedMessage(MAX_OTP_ATTEMPTS, failResult.remainingTimeStr));
      } else {
        const remainingTries = MAX_OTP_ATTEMPTS - failResult.attempts;
        setErrorMessage(
          `${err.message || t.incorrectCodeTryAgain}${t.attemptsLeftSuffix(remainingTries)}`
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
      setErrorMessage(t.sendLockedMessage(MAX_OTP_ATTEMPTS, rateStatus.remainingTimeStr));
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
        if (!preflight.success) throw new Error(preflight.error || t.resendFailed);
        await sendMsg91Otp(toMsg91Identifier(finalPhone));
      }

      recordOtpSendAttempt(finalPhone);
      refreshLock();
      setOtpCode('');
      setCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || t.resendFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[510] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100/80 p-7 sm:p-8 space-y-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer" aria-label={t.close}>
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="w-13 h-13 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3.5">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{t.title}</h2>
          <p className="mt-1.5 text-xs text-slate-500">
            {step === 'phone'
              ? t.verifyPrompt
              : t.enterCodeSentTo(phoneNumber)}
          </p>
        </div>

        {bannerLockMs > 0 && (
          <div className="p-3.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold">{t.lockedTitle}</p>
              <p className="text-[11.5px] text-amber-800 mt-0.5">
                {step === 'otp'
                  ? `${MAX_OTP_ATTEMPTS} ${t.incorrectCodesEntered}`
                  : `${MAX_OTP_ATTEMPTS} ${t.attemptsUsed}`}{' '}
                {t.tryAgainIn} <span className="font-bold font-mono">{formatRemainingTime(bannerLockMs)}</span>.
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-[#446FF2] focus:ring-2 focus:ring-[#446FF2]/20 outline-none transition-all font-medium text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <PhoneInputWithCountry
                value={phoneNumber}
                onChange={(full, digits) => { setPhoneNumber(full); setPhoneDigits(digits); }}
                placeholder={t.phonePlaceholder}
              />
            </div>
            <FlowButton
              type="submit"
              fullWidth
              loading={isSubmitting}
              disabled={!fullName.trim() || phoneDigits.length < 10 || sendLockMs > 0}
            >
              {sendLockMs > 0 ? t.locked(formatRemainingTime(sendLockMs)) : t.sendCode}
            </FlowButton>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={t.otpPlaceholder}
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
              {verifyLockMs > 0 ? `${t.lockedWord} (${formatRemainingTime(verifyLockMs)})` : t.verifyAndContinue}
            </FlowButton>
            <div className="flex items-center justify-between pt-1 text-xs">
              <button type="button" onClick={() => { setStep('phone'); setOtpCode(''); setErrorMessage(null); }} className="text-gray-500 hover:text-black font-medium transition-colors cursor-pointer">
                {t.changePhoneNumber}
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
                    ? t.noMoreCodes(formatRemainingTime(sendLockMs))
                    : countdown > 0
                    ? t.resendIn(countdown)
                    : t.resendCode}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
