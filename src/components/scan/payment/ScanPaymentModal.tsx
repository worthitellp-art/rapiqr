import React, { useState } from 'react';
import { X, MoreHorizontal, Loader2, ArrowLeft } from 'lucide-react';
import ScanPaymentSummaryPanel from './ScanPaymentSummaryPanel';
import ScanExitConfirmModal from './ScanExitConfirmModal';

interface ScanPaymentModalProps {
  price?: string;
  userPhone?: string;
  qrId?: string;
  category?: string;
  vehicleNumber?: string;
  name?: string;
  onNameChange?: (name: string) => void;
  phone?: string;
  onPhoneChange?: (phone: string) => void;
  country?: string;
  onCountryChange?: (country: string) => void;
  message?: string;
  onMessageChange?: (message: string) => void;
  otpStep?: boolean;
  otpInput?: string;
  onOtpInputChange?: (otp: string) => void;
  otpSending?: boolean;
  isProcessing?: boolean;
  error?: string | null;
  onSubmit?: () => void;
  onResendOtp?: () => void;
  onBackToPhone?: () => void;
  onSuccess?: (paymentData: any) => void;
  onExit: () => void;
}

export default function ScanPaymentModal({
  price = '₹299',
  userPhone = '+91 95747 13004',
  qrId = 'A4517DA1',
  category = 'Car & Auto & Truck',
  vehicleNumber = '',
  name = '',
  onNameChange,
  phone = '',
  onPhoneChange,
  country = '+91',
  onCountryChange,
  message = '',
  onMessageChange,
  otpStep = false,
  otpInput = '',
  onOtpInputChange,
  otpSending = false,
  isProcessing = false,
  error = null,
  onSubmit,
  onResendOtp,
  onBackToPhone,
  onSuccess,
  onExit,
}: ScanPaymentModalProps) {
  const [showExitModal, setShowExitModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleOpenExitConfirm = () => {
    setShowExitModal(true);
  };

  const handleCloseExitConfirm = () => {
    setShowExitModal(false);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    onExit();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit();
    } else if (onSuccess) {
      onSuccess({ name, phone, category, qrId, message });
    }
  };

  const displayPhone = phone
    ? `${country} ${phone}`
    : userPhone;

  return (
    <div className="w-full flex items-center justify-center p-2 sm:p-4 animate-fade-in font-display">
      {/* Outer Card matching sccanpagedesign.png */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col lg:flex-row min-h-[580px] relative">
        {/* Left Side: Golden Yellow Summary Panel */}
        <ScanPaymentSummaryPanel price={price} userPhone={displayPhone} />

        {/* Right Side: Information Input Filling Interface */}
        <div className="w-full lg:w-[65%] flex flex-col justify-between bg-white p-6 sm:p-8">
          {/* Top Bar with Title, Options, and Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900">
                {otpStep ? 'Verify Phone Number' : "Let's connect"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {otpStep
                  ? 'Enter the 6-digit verification code sent to your phone.'
                  : 'Enter your contact details to activate 24/7 smart vehicle protection.'}
              </p>
            </div>

            <div className="flex items-center gap-3 text-slate-400 flex-shrink-0">
              <button
                type="button"
                className="hover:text-slate-600 transition-colors cursor-pointer p-1"
                aria-label="More options"
              >
                <MoreHorizontal size={18} />
              </button>

              <button
                type="button"
                onClick={handleOpenExitConfirm}
                className="hover:text-slate-800 transition-colors cursor-pointer p-1"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between pt-5 space-y-4">
            {!otpStep ? (
              <div className="space-y-3.5">
                {/* 1. Name Input */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-black transition-all p-3.5 shadow-2xs">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange?.(e.target.value)}
                    placeholder="Your Name"
                    required
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>

                {/* 2. Phone Input with Country Code */}
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-black transition-all shadow-2xs overflow-hidden">
                  <div className="flex items-center gap-1 px-3.5 py-3 border-r border-slate-200 bg-slate-100/70 text-slate-800 text-xs font-bold select-none">
                    <span>{country}</span>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => onPhoneChange?.(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Your 10-digit mobile number"
                    required
                    className="w-full px-3.5 py-3 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>

                {/* 3. Category & Tag ID Badges */}
                <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                    {category}
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">
                    #{qrId}
                  </div>
                  {vehicleNumber && (
                    <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-mono font-bold text-amber-900">
                      {vehicleNumber}
                    </div>
                  )}
                </div>

                {/* 4. Optional Message / Notes */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-black transition-all p-3.5 shadow-2xs">
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => onMessageChange?.(e.target.value)}
                    placeholder="Message (optional notes or vehicle plate number)"
                    className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none resize-none"
                  />
                </div>

                {/* Error Banner if any */}
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                    {error}
                  </div>
                )}

                {/* 5. SafeSync Agreement Checkbox matching RBI guidelines styling in mockup */}
                <label className="flex items-center gap-2.5 text-xs text-slate-600 font-medium cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black accent-black cursor-pointer"
                  />
                  <span>Enable 24/7 SafeSync™ masked call proxy and emergency alerts</span>
                </label>
              </div>
            ) : (
              /* OTP Verification View inside the exact same right panel */
              <div className="space-y-4 py-2">
                <button
                  type="button"
                  onClick={onBackToPhone}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Change phone number</span>
                </button>

                <div className="space-y-2">
                  <p className="text-xs text-slate-600">
                    Enter the 6-digit code sent to <span className="font-bold text-slate-900">{country} {phone}</span>
                  </p>
                  <div className="rounded-2xl border-2 border-slate-900 p-4 bg-white shadow-xs">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => onOtpInputChange?.(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      required
                      autoFocus
                      className="w-full text-center tracking-[0.5em] text-2xl font-bold font-mono text-slate-900 outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={onResendOtp}
                    disabled={otpSending}
                    className="font-bold text-black hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {otpSending ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {/* Solid Black Button matching Continue button from sccanpagedesign.png */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isProcessing || otpSending}
                className="w-full py-4 rounded-xl bg-black hover:bg-zinc-900 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing || otpSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{otpStep ? 'Verify & Continue' : 'Continue'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Exit Confirmation Dialog from designformscanpage.png */}
      <ScanExitConfirmModal
        isOpen={showExitModal}
        onContinuePayment={handleCloseExitConfirm}
        onConfirmExit={handleConfirmExit}
      />
    </div>
  );
}
