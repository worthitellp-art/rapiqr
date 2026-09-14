import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Car,
  Bike,
  Briefcase,
  HeartHandshake,
  Trash2,
  Plus,
} from 'lucide-react';
import ScanExitConfirmModal from './ScanExitConfirmModal';

export interface EmergencyContactItem {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface ScanPaymentModalProps {
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

  // Multi-step phase support for seamless Windows wizard experience
  phase?: 'activation' | 'register' | 'success';
  emergencyContacts?: EmergencyContactItem[];
  onAddEmergencyContact?: () => void;
  onRemoveEmergencyContact?: (id: string) => void;
  onUpdateEmergencyContact?: (id: string, field: 'name' | 'relationship' | 'phone', value: string) => void;
  onFinishEmergencyContacts?: () => void;
  onSkipEmergencyContacts?: () => void;
  onViewTag?: () => void;
}

interface StepDefinition {
  index: number;
  title: string;
  description: string;
}

const WIZARD_STEPS: StepDefinition[] = [
  { index: 0, title: 'Owner details', description: 'Contact information' },
  { index: 1, title: 'Verification', description: 'One-time phone passcode' },
  { index: 2, title: 'Emergency SOS', description: 'Trusted guardian contacts' },
  { index: 3, title: 'Live protection', description: 'Smart tag activation' },
];

const RELATIONSHIP_PRESETS = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Doctor'];

function getCategoryIcon(categoryName: string) {
  const lower = (categoryName || '').toLowerCase();
  if (lower.includes('bike') || lower.includes('cycle') || lower.includes('motor')) return Bike;
  if (lower.includes('bag') || lower.includes('luggage')) return Briefcase;
  if (lower.includes('pet') || lower.includes('personal') || lower.includes('health')) return HeartHandshake;
  return Car;
}

export default function ScanPaymentModal({
  price = '₹299',
  qrId = 'A4517DA1',
  category = 'Car & Auto & Truck',
  vehicleNumber = '',
  name = '',
  onNameChange,
  phone = '',
  onPhoneChange,
  country = '+91',
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
  phase = 'activation',
  emergencyContacts = [],
  onAddEmergencyContact,
  onRemoveEmergencyContact,
  onUpdateEmergencyContact,
  onFinishEmergencyContacts,
  onSkipEmergencyContacts,
  onViewTag,
}: ScanPaymentModalProps) {
  const [showExitModal, setShowExitModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(category);

  // Keep category in sync with prop if updated from tag QR data
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);

  const CategoryIconComponent = getCategoryIcon(selectedCategory || category);

  // Compute active step index across the unified multi-step journey
  const computeActiveStepIndex = (): number => {
    if (phase === 'success') return 3;
    if (phase === 'register') return 2;
    if (otpStep) return 1;
    return 0;
  };

  const activeStepIndex = computeActiveStepIndex();

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

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeStepIndex === 2 && onFinishEmergencyContacts) {
      onFinishEmergencyContacts();
      return;
    }

    if (onSubmit) {
      onSubmit();
    } else if (onSuccess) {
      onSuccess({ name, phone, category: selectedCategory, qrId, message });
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in font-display">
      {/* ── Windows-Style Application Window Container ── */}
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-3xl sm:rounded-[32px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.09)] border border-slate-200/90 overflow-hidden flex flex-col md:flex-row min-h-[560px] text-left">
        
        {/* ── Left Sidebar: Vertical Stepper & Meta ── */}
        <aside className="w-full md:w-72 lg:w-80 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between select-none">
          <div>
            {/* Top Navigation: Back button */}
            <button
              type="button"
              onClick={handleOpenExitConfirm}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors cursor-pointer group mb-6 sm:mb-8"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Back to scan</span>
            </button>

            {/* Mobile Horizontal Progress Bar (< md screens) */}
            <div className="flex md:hidden items-center justify-between gap-2 pb-4 mb-2 border-b border-slate-200/70">
              {WIZARD_STEPS.map((step, idx) => (
                <div key={step.index} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      idx < activeStepIndex
                        ? 'bg-emerald-500 text-white'
                        : idx === activeStepIndex
                        ? 'border-2 border-black text-black bg-white'
                        : 'border border-slate-300 text-slate-400 bg-white'
                    }`}
                  >
                    {idx < activeStepIndex ? <Check size={12} strokeWidth={3} /> : idx + 1}
                  </div>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-6 sm:w-10 ${
                        idx < activeStepIndex ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Vertical Stepper (>= md screens) */}
            <div className="hidden md:flex flex-col space-y-0">
              {WIZARD_STEPS.map((step, index) => {
                const isCompleted = index < activeStepIndex;
                const isActive = index === activeStepIndex;
                const isLast = index === WIZARD_STEPS.length - 1;

                return (
                  <div key={step.index} className="relative flex items-start gap-4 pb-8 last:pb-0">
                    {/* Vertical connecting line */}
                    {!isLast && (
                      <div
                        className={`absolute left-[11px] top-[24px] bottom-0 w-[2px] transition-colors ${
                          isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}

                    {/* Step Icon / Circle Indicator */}
                    <div className="relative z-10 flex-shrink-0">
                      {isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : isActive ? (
                        /* Clean black ring with solid inner dot */
                        <div className="w-6 h-6 rounded-full border-2 border-black bg-white flex items-center justify-center shadow-xs">
                          <div className="w-2.5 h-2.5 rounded-full bg-black" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white" />
                      )}
                    </div>

                    {/* Step Text Label */}
                    <div className="pt-0.5">
                      <p
                        className={`text-sm tracking-tight leading-tight ${
                          isActive
                            ? 'font-bold text-slate-950'
                            : isCompleted
                            ? 'font-semibold text-slate-700'
                            : 'font-medium text-slate-400'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Sidebar Meta: Tag Info & Price */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-700">#{qrId}</span>
              <span className="font-bold text-slate-900 bg-slate-200/80 px-2.5 py-0.5 rounded-md text-[11px]">
                {price} · Lifetime Tag
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Official RapiQR SafeSync™</span>
            </p>
          </div>
        </aside>

        {/* ── Right Content Area: Clean Forms with Minimal Text ── */}
        <main className="flex-1 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between overflow-y-auto">
          {/* STEP 1: Owner Details */}
          {activeStepIndex === 0 && (
            <form onSubmit={handleFormSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                    About your tag
                  </h2>
                </div>

                {/* Form Field Rows */}
                <div className="space-y-4 pt-2">
                  {/* Field: Full Name */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 items-center">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">
                      Your full name
                    </label>
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => onNameChange?.(e.target.value)}
                        placeholder="Full name"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Field: Mobile Number */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 items-center">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">
                      Mobile number
                    </label>
                    <div className="md:col-span-2 flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black overflow-hidden transition-all">
                      <div className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 select-none">
                        {country}
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => onPhoneChange?.(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        required
                        className="w-full px-3.5 py-2.5 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Field: Preselected Tag Category (Auto-generated from tag QR) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 items-center">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">
                      Tag category
                    </label>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <div className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 text-xs sm:text-sm font-semibold shadow-2xs">
                        <CategoryIconComponent size={16} className="text-slate-800" />
                        <span>{selectedCategory || category || 'Car & Auto & Truck'}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          Preselected
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Field: Vehicle Plate / Description */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 items-center">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">
                      Vehicle plate / Note
                    </label>
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={message || vehicleNumber}
                        onChange={(e) => onMessageChange?.(e.target.value)}
                        placeholder="e.g. MH 02 AB 1234 (optional)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Field: Privacy Proxy Checkbox */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 items-center pt-1">
                    <div className="hidden md:block" />
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black accent-black cursor-pointer"
                        />
                        <span>Enable SafeSync™ call masking (keeps phone number private)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                    {error}
                  </div>
                )}
              </div>

              {/* Bottom Action CTA: Clean Black Button */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isProcessing || otpSending}
                  className="w-full sm:w-auto min-w-[140px] px-8 py-3 rounded-xl bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-semibold text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing || otpSending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Phone Verification (OTP) */}
          {activeStepIndex === 1 && (
            <form onSubmit={handleFormSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                    Verify phone number
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Enter the 6-digit code sent to <span className="font-bold text-slate-800">{country} {phone}</span>
                  </p>
                </div>

                <div className="space-y-4 pt-2 max-w-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 items-center">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">
                      Verification code
                    </label>
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => onOtpInputChange?.(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        required
                        autoFocus
                        className="w-full tracking-[0.4em] text-center text-2xl font-bold py-2.5 rounded-xl border-2 border-slate-900 bg-white focus:ring-2 focus:ring-black/10 outline-none text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={onBackToPhone}
                      className="font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      ← Change number
                    </button>
                    <button
                      type="button"
                      onClick={onResendOtp}
                      disabled={otpSending}
                      className="font-bold text-slate-900 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {otpSending ? 'Resending code...' : 'Resend code'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                    {error}
                  </div>
                )}
              </div>

              {/* Bottom Action CTA: Clean Black Button */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isProcessing || otpSending}
                  className="w-full sm:w-auto min-w-[160px] px-8 py-3 rounded-xl bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-semibold text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Emergency SOS (Guardian Network) */}
          {activeStepIndex === 2 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                    Emergency contacts
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Add trusted family or friends who receive live GPS alerts during emergencies.
                  </p>
                </div>

                {/* Contacts List */}
                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {emergencyContacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          Contact {index + 1} {index === 0 ? '· Primary SOS' : ''}
                        </span>
                        {emergencyContacts.length > 1 && onRemoveEmergencyContact && (
                          <button
                            type="button"
                            onClick={() => onRemoveEmergencyContact(contact.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => onUpdateEmergencyContact?.(contact.id, 'name', e.target.value)}
                          placeholder="Contact full name"
                          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => onUpdateEmergencyContact?.(contact.id, 'phone', e.target.value)}
                          placeholder="10-digit mobile number"
                          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {RELATIONSHIP_PRESETS.map((label) => {
                          const isPicked = contact.relationship === label;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => onUpdateEmergencyContact?.(contact.id, 'relationship', label)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                                isPicked
                                  ? 'border-black bg-black text-white font-semibold'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 font-medium'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {onAddEmergencyContact && (
                  <button
                    type="button"
                    onClick={onAddEmergencyContact}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus size={15} />
                    <span>Add another contact</span>
                  </button>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                    {error}
                  </div>
                )}
              </div>

              {/* Bottom Action CTAs: Clean Black Button */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                {onSkipEmergencyContacts && (
                  <button
                    type="button"
                    onClick={onSkipEmergencyContacts}
                    disabled={isProcessing}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Skip for now
                  </button>
                )}

                <button
                  type="button"
                  onClick={onFinishEmergencyContacts}
                  disabled={isProcessing}
                  className="ml-auto px-8 py-3 rounded-xl bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-semibold text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Activate Tag</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Live Protection Confirmation */}
          {activeStepIndex === 3 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between text-center py-4">
              <div className="space-y-4 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-inner">
                  <CheckCircle2 size={36} className="text-emerald-600" />
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                    All set! Tag is live
                  </h2>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onViewTag}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-semibold text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>View Public Scan Tag</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Exit Confirmation Dialog */}
      <ScanExitConfirmModal
        isOpen={showExitModal}
        onContinuePayment={handleCloseExitConfirm}
        onConfirmExit={handleConfirmExit}
      />
    </div>
  );
}
