import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Loader2,
  Phone,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clock,
} from 'lucide-react';
import AppLogo from '../common/AppLogo';
import { FlowButton } from '../ui/flow-button';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
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
import { useLanguage } from '../../context/LanguageContext';
import { authTranslations } from '../../i18n/authTranslations';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  prefillEmail?: string;
  onModeChange?: (mode: 'login' | 'signup') => void;
  onBackHome: () => void;
  onSuccess: () => void;
}

export default function AuthPage({
  onBackHome,
  onSuccess,
}: AuthPageProps) {
  const { sendPhoneLoginOtp, verifyPhoneLoginOtp, signInWithGoogle } = useAuth();
  const { language } = useLanguage();
  const t = authTranslations[language].client;

  const sendLockedMessage = (time: string) => t.errors.sendLocked(MAX_OTP_ATTEMPTS, time);
  const verifyLockedMessage = (time: string) => t.errors.verifyLocked(MAX_OTP_ATTEMPTS, time);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Active phone number
  const activePhone = phoneNumber || phoneDigits;

  // sendLockMs: no more codes can be requested. verifyLockMs: no more guesses
  // (and no new codes either — sendLockMs covers that case too).
  const { sendLockMs, verifyLockMs, refresh: refreshLock } = useOtpLock(activePhone);
  const bannerLockMs = step === 'otp' ? verifyLockMs : sendLockMs;

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsGoogleSubmitting(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setSuccessMessage(t.success.googleSignedIn);
        localStorage.setItem('rapiqr-phone-number-filled', 'true');
        localStorage.setItem('rapiqr-phone-asked-once', 'true');
        localStorage.setItem('repiqr-current-page', 'dashboard');
        localStorage.setItem('namoqr-current-page', 'dashboard');
        setTimeout(() => {
          onSuccess();
        }, 250);
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t.errors.googleSignInFailed);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const clean = phoneDigits.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage(t.errors.invalidPhone);
      return;
    }

    const finalPhone = phoneNumber || clean;

    // Check rate limit (3 codes, then a 1 hour lock)
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
      // Backend pre-flight (format/ownership checks) first
      const res = await sendPhoneLoginOtp(finalPhone);
      if (!res.success) {
        setErrorMessage(res.error || t.errors.sendFailedGeneric);
        return;
      }
      await sendMsg91Otp(toMsg91Identifier(finalPhone));

      // Record the send. The 3rd code is still valid, so we move on to the OTP
      // step either way — only further requests get locked.
      const attemptResult = recordOtpSendAttempt(finalPhone);
      refreshLock();
      setSuccessMessage(
        attemptResult.isLocked
          ? t.success.codeSentLastRequest
          : t.success.codeSentWithCount(attemptResult.attempts, MAX_OTP_ATTEMPTS)
      );
      setStep('otp');
      setCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || t.errors.networkErrorSending);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const finalPhone = phoneNumber || phoneDigits;
    const rateStatus = checkOtpRateLimit(finalPhone, 'verify');
    if (rateStatus.isLocked) {
      refreshLock();
      setErrorMessage(verifyLockedMessage(rateStatus.remainingTimeStr));
      return;
    }

    const trimmedOtp = otpCode.trim();
    if (!trimmedOtp || trimmedOtp.length < 4) {
      setErrorMessage(t.errors.enterCode);
      return;
    }

    setIsSubmitting(true);
    try {
      const accessToken = await verifyMsg91Otp(trimmedOtp);
      const res = await verifyPhoneLoginOtp(phoneNumber, accessToken);
      if (res.success) {
        // Clear rate limiting upon successful login
        clearOtpRateLimit(finalPhone);
        setSuccessMessage(t.success.verifiedSuccessfully);
        localStorage.setItem('rapiqr-phone-number-filled', 'true');
        localStorage.setItem('rapiqr-phone-asked-once', 'true');
        localStorage.setItem('repiqr-current-page', 'dashboard');
        localStorage.setItem('namoqr-current-page', 'dashboard');
        setTimeout(() => {
          onSuccess();
        }, 250);
      } else {
        // Record failed attempt
        const failResult = recordOtpVerifyFailure(finalPhone);
        refreshLock();
        if (failResult.isLocked) {
          setErrorMessage(verifyLockedMessage(failResult.remainingTimeStr));
        } else {
          const remainingTries = MAX_OTP_ATTEMPTS - failResult.attempts;
          setErrorMessage(
            `${res.error || t.errors.invalidCodeGeneric} ${t.errors.attemptsRemaining(remainingTries)}`
          );
        }
      }
    } catch (err: any) {
      // Record failed attempt on error
      const failResult = recordOtpVerifyFailure(finalPhone);
      refreshLock();
      if (failResult.isLocked) {
        setErrorMessage(verifyLockedMessage(failResult.remainingTimeStr));
      } else {
        const remainingTries = MAX_OTP_ATTEMPTS - failResult.attempts;
        setErrorMessage(
          `${err.message || t.errors.verificationFailedGeneric} ${t.errors.attemptsRemaining(remainingTries)}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting || sendLockMs > 0) return;
    setErrorMessage('');
    setSuccessMessage('');

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
        const res = await sendPhoneLoginOtp(finalPhone);
        if (!res.success) throw new Error(res.error || t.errors.resendFailedGeneric);
        await sendMsg91Otp(toMsg91Identifier(finalPhone));
      }

      const attemptResult = recordOtpSendAttempt(finalPhone);
      refreshLock();
      setOtpCode('');
      setSuccessMessage(
        attemptResult.isLocked
          ? t.success.newCodeSentLastRequest
          : t.success.newCodeSentWithCount(attemptResult.attempts, MAX_OTP_ATTEMPTS)
      );
      setCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || t.errors.resendFailedGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 text-[#14120C] font-sans antialiased">
      {/* ── Top Bar ── */}
      <header className="w-full max-w-5xl mx-auto px-5 py-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#14120C]/60 hover:text-[#14120C] transition-colors cursor-pointer py-1.5 px-3 rounded-full hover:bg-[#14120C]/[0.04]"
        >
          <ArrowLeft size={16} />
          <span>{t.backToHome}</span>
        </button>

        <span className="text-xs font-medium text-gray-500">
          {t.accountAccess}
        </span>
      </header>

      {/* ── Centered Auth Card ── */}
      <main className="w-full my-auto flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] mx-auto bg-white rounded-2xl border border-gray-200 p-7 sm:p-9 shadow-sm">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <button
              onClick={onBackHome}
              className="cursor-pointer focus:outline-hidden"
              aria-label={t.homeAriaLabel}
            >
              <AppLogo variant="light" className="h-8 w-auto object-contain" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {step === 'phone' ? t.signInTitle : t.enterCodeTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
              {step === 'phone' ? t.signInSubtitle : t.codeSentTo(phoneNumber)}
            </p>
          </div>

          {/* Lockout Cooldown Notice */}
          {bannerLockMs > 0 && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2.5">
              <Clock size={16} className="shrink-0 mt-0.5 text-amber-700" />
              <div>
                <p className="font-bold text-amber-900">{t.lockedForOneHour}</p>
                <p className="text-[11.5px] text-amber-800 mt-0.5 leading-relaxed">
                  {step === 'otp'
                    ? t.otpIncorrectCodesEntered(MAX_OTP_ATTEMPTS)
                    : t.sendAttemptsUsed(MAX_OTP_ATTEMPTS)}{' '}
                  {t.tryAgainIn} <span className="font-bold font-mono">{formatRemainingTime(bannerLockMs)}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === 'phone' ? (
            <div className="space-y-5">
              {/* Google Sign-In Button (Client Only) */}
              <button
                type="button"
                disabled={isSubmitting || isGoogleSubmitting}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 hover:border-gray-400 font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isGoogleSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-gray-700" />
                    <span>{t.connectingToGoogle}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{t.continueWithGoogle}</span>
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  {t.orWithMobileNumber}
                </span>
              </div>

              {/* ── Step 1: Phone Number Input ── */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    {t.mobileNumberLabel}
                  </label>
                  <PhoneInputWithCountry
                    value={phoneNumber}
                    onChange={(full, digits) => {
                      setPhoneNumber(full);
                      setPhoneDigits(digits);
                    }}
                    placeholder={t.mobileNumberPlaceholder}
                    required
                  />
                </div>

                <FlowButton
                  type="submit"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isGoogleSubmitting || phoneDigits.length < 10 || sendLockMs > 0}
                >
                  {isSubmitting ? (
                    t.sendingCode
                  ) : sendLockMs > 0 ? (
                    <>
                      <Clock size={15} className="text-amber-700" />
                      {t.lockedWithTime(formatRemainingTime(sendLockMs))}
                    </>
                  ) : (
                    t.sendVerificationCode
                  )}
                </FlowButton>
              </form>
            </div>
          ) : (
            /* ── Step 2: OTP Verification ── */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  {t.verificationCodeLabel}
                </label>
                <div className="relative">
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
                    className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 rounded-xl bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-gray-900 placeholder:text-gray-300 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <FlowButton
                type="submit"
                fullWidth
                loading={isSubmitting}
                disabled={otpCode.trim().length < 4 || verifyLockMs > 0}
              >
                {isSubmitting ? (
                  t.verifyingCode
                ) : verifyLockMs > 0 ? (
                  <>
                    <Clock size={15} className="text-amber-700" />
                    {t.lockedParenTime(formatRemainingTime(verifyLockMs))}
                  </>
                ) : (
                  t.verifyAndEnterDashboard
                )}
              </FlowButton>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtpCode('');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-gray-500 hover:text-black font-medium transition-colors cursor-pointer"
                >
                  {t.changePhoneNumber}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || isSubmitting || sendLockMs > 0}
                  className="text-gray-700 hover:text-black font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
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

          {/* Privacy Note */}
          <div className="mt-8 pt-5 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">
              {t.privacyNote}
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} RapiQR. {t.footerSecurePhoneVerification}
      </footer>
    </div>
  );
}
