import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Loader2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import AppLogo from '../common/AppLogo';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import { useAuth } from '../../context/AuthContext';
import { sendMsg91Otp, verifyMsg91Otp, retryMsg91Otp, toMsg91Identifier } from '../../lib/msg91Widget';

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
  const { sendPhoneLoginOtp, verifyPhoneLoginOtp } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const clean = phoneDigits.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPhone = phoneNumber || clean;
      // Backend pre-flight (format/ownership checks) first, THEN actually ask
      // MSG91's widget to send the code — the pre-flight alone never sends
      // anything, it only clears the way for the widget call below.
      const res = await sendPhoneLoginOtp(finalPhone);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to send verification code. Please try again.');
        return;
      }
      await sendMsg91Otp(toMsg91Identifier(finalPhone));
      setSuccessMessage(res.message || 'Verification code sent to your phone.');
      setStep('otp');
      setCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while sending verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedOtp = otpCode.trim();
    if (!trimmedOtp || trimmedOtp.length < 4) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      // The widget verifies the code with MSG91 directly and hands back an
      // access token; the backend re-verifies that token server-to-server —
      // this app never checks the OTP itself.
      const accessToken = await verifyMsg91Otp(trimmedOtp);
      const res = await verifyPhoneLoginOtp(phoneNumber, accessToken);
      if (res.success) {
        setSuccessMessage('Verified successfully! Loading dashboard…');
        localStorage.setItem('rapiqr-phone-number-filled', 'true');
        localStorage.setItem('rapiqr-phone-asked-once', 'true');
        setTimeout(() => {
          onSuccess();
        }, 400);
      } else {
        setErrorMessage(res.error || 'Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting) return;
    await handleSendOtp();
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
          <span>Back to home</span>
        </button>

        <span className="text-xs font-medium text-gray-500">
          Instant Phone Access
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
              aria-label="RapiQR home"
            >
              <AppLogo variant="light" className="h-8 w-auto object-contain" />
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {step === 'phone' ? 'Sign In with Phone' : 'Enter Verification Code'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
              {step === 'phone'
                ? 'Enter your mobile number to access your dashboard & stickers'
                : `We sent a verification code to ${phoneNumber}`}
            </p>
          </div>

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
            /* ── Step 1: Phone Number Input ── */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Mobile Number
                </label>
                <PhoneInputWithCountry
                  value={phoneNumber}
                  onChange={(full, digits) => {
                    setPhoneNumber(full);
                    setPhoneDigits(digits);
                  }}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || phoneDigits.length < 10}
                className="w-full py-3 px-4 rounded-xl bg-white text-black border border-gray-300 hover:border-black font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Sending Code…</span>
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
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter code"
                    autoFocus
                    className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 rounded-xl bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-gray-900 placeholder:text-gray-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpCode.trim().length < 4}
                className="w-full py-3 px-4 rounded-xl bg-white text-black border border-gray-300 hover:border-black font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Verifying Code…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Verify &amp; Enter Dashboard</span>
                  </>
                )}
              </button>

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
                  Change phone number
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || isSubmitting}
                  className="text-gray-700 hover:text-black font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Privacy Note */}
          <div className="mt-8 pt-5 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">
              By continuing, you agree to RapiQR’s Terms of Service &amp; Privacy Policy.
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} RapiQR. Secure phone verification.
      </footer>
    </div>
  );
}
