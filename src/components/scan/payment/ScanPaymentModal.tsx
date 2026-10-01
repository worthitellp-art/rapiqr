import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Car,
  Bike,
  Briefcase,
  HeartHandshake,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import ScanExitConfirmModal from './ScanExitConfirmModal';
import { isVehicleCategory } from '../../../stickerModules';
import { ACTIVATION_COUNTRIES, getPhoneDigitRule } from '../ScanPage';

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
  onVehicleNumberChange?: (vehicleNumber: string) => void;
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
}

const WIZARD_STEPS: StepDefinition[] = [
  { index: 0, title: 'Your details' },
  { index: 1, title: 'Verify phone' },
  { index: 2, title: 'Emergency contacts' },
  { index: 3, title: 'Done' },
];

const RELATIONSHIP_PRESETS = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Doctor'];

function getCategoryIcon(categoryName: string) {
  const lower = (categoryName || '').toLowerCase();
  if (lower.includes('bike') || lower.includes('cycle') || lower.includes('motor')) return Bike;
  if (lower.includes('bag') || lower.includes('luggage')) return Briefcase;
  if (lower.includes('pet') || lower.includes('personal') || lower.includes('health')) return HeartHandshake;
  return Car;
}

const inputClass =
  'w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white focus:border-[#14120C] focus:ring-2 focus:ring-[#14120C]/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all';

export default function ScanPaymentModal({
  price,
  qrId = 'A4517DA1',
  category = 'Car & Auto & Truck',
  vehicleNumber = '',
  onVehicleNumberChange,
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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category);

  useEffect(() => {
    if (category) setSelectedCategory(category);
  }, [category]);

  const CategoryIconComponent = getCategoryIcon(selectedCategory || category);
  const isVehicle = isVehicleCategory(selectedCategory || category);
  const phoneRule = getPhoneDigitRule(country);

  const activeStepIndex = (() => {
    if (phase === 'success') return 3;
    if (phase === 'register') return 2;
    if (otpStep) return 1;
    return 0;
  })();

  const handleConfirmExit = () => {
    setShowExitModal(false);
    onExit();
  };

  const handleOwnerDetailsSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setConsentTouched(true);
    if (!agreeTerms) return;

    if (onSubmit) onSubmit();
    else if (onSuccess) onSuccess({ name, phone, category: selectedCategory, qrId, vehicleNumber, message });
  };

  const handleOtpSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <div className="w-full flex items-center justify-center px-4 py-3 sm:py-12 animate-fade-in">
      <div className="w-full max-w-xl">
        {/* Tag context line — honest, no payment framing: nothing is purchased here */}
        <p className="mb-2 sm:mb-5 text-center text-[12px] sm:text-[13px] font-medium text-slate-500">
          Registering tag <span className="font-mono font-semibold text-slate-700">#{qrId}</span>
        </p>

        {/* Compact step indicator (mobile): one line of text + a thin progress bar,
            so a long label like "Emergency contacts" never has to squeeze under a
            ~90px-wide slot the way the 4-node layout below needs. */}
        <div className="sm:hidden mb-3">
          <div className="flex items-center justify-between text-[12px] font-semibold text-slate-700 mb-1.5">
            <span>
              Step {activeStepIndex + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[activeStepIndex].title}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#14120C] transition-all"
              style={{ width: `${((activeStepIndex + 1) / WIZARD_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Full step indicator (sm and up): node circles + labels */}
        <ol className="hidden sm:flex items-center mb-7">
          {WIZARD_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isActive = idx === activeStepIndex;
            const isLast = idx === WIZARD_STEPS.length - 1;
            return (
              <li key={step.index} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isActive
                        ? 'bg-[#14120C] text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                  </div>
                  <span
                    className={`block text-[11px] font-semibold text-center leading-tight ${
                      isActive ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {!isLast && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
              </li>
            );
          })}
        </ol>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 sm:p-8">
          {/* STEP 1: Owner Details */}
          {activeStepIndex === 0 && (
            <form onSubmit={handleOwnerDetailsSubmit} className="space-y-4 sm:space-y-5">
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">Tell us a bit more</h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">Your full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange?.(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1.5">Mobile phone number</label>
                  <div className="flex items-stretch gap-2">
                    <select
                      value={country}
                      onChange={(e) => onCountryChange?.(e.target.value)}
                      className="w-[4.5rem] flex-shrink-0 h-11 rounded-lg border border-slate-300 bg-white pl-2 pr-1 text-sm text-slate-900 outline-none focus:border-[#14120C] focus:ring-2 focus:ring-[#14120C]/15 transition-all"
                      aria-label="Country code"
                    >
                      {/* Closed box shows just the dial code (there's no room for a
                          full country name next to the phone input on a phone
                          screen) — the full name still appears per-option when the
                          native picker is open, via the title attribute some
                          browsers surface and the option order grouping India first. */}
                      {ACTIVATION_COUNTRIES.map((c) => (
                        <option key={c.code + c.name} value={c.code} title={c.name}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => onPhoneChange?.(e.target.value.replace(/\D/g, '').slice(0, phoneRule.max))}
                      placeholder={`${phoneRule.min === phoneRule.max ? phoneRule.min : `${phoneRule.min}-${phoneRule.max}`}-digit number`}
                      required
                      className={`${inputClass} flex-1 min-w-0`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between h-9 px-3.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900">
                  <div className="flex items-center gap-2">
                    <CategoryIconComponent size={14} className="text-slate-600" />
                    <span className="font-medium">{selectedCategory || category || 'Car & Auto & Truck'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Preselected</span>
                </div>

                {isVehicle ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                      Vehicle number <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={vehicleNumber || ''}
                        onChange={(e) => onVehicleNumberChange?.(e.target.value.toUpperCase())}
                        placeholder="e.g. MH 02 AB 1234"
                        required
                        minLength={4}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck={false}
                        className={`${inputClass} pr-9 font-mono uppercase`}
                      />
                      {vehicleNumber && (
                        <button
                          type="button"
                          onClick={() => onVehicleNumberChange?.('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                          title="Clear vehicle number"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1.5">Tag note / Label</label>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => onMessageChange?.(e.target.value)}
                      placeholder="e.g. Main Gate, Office, Pet Name (optional)"
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        setConsentTouched(true);
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#14120C] focus:ring-[#14120C] cursor-pointer accent-[#14120C]"
                    />
                    <span>
                      I agree this information will be stored to activate my RepiQR tag and may be shown to a scanner in
                      an emergency.
                    </span>
                  </label>
                  {consentTouched && !agreeTerms && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      Please confirm this to continue — the tag can't be activated without it.
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isProcessing || otpSending}
                  className="w-full h-11 rounded-lg bg-[#14120C] hover:bg-black active:scale-[0.99] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing || otpSending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  className="w-full mt-3 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Phone Verification (OTP) */}
          {activeStepIndex === 1 && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Verify phone number</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter the code sent to <span className="font-semibold text-slate-800">{country} {phone}</span>
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpInput}
                onChange={(e) => onOtpInputChange?.(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter code"
                required
                autoFocus
                className="w-full h-12 text-center tracking-[0.4em] font-mono text-lg rounded-lg border border-slate-300 bg-white focus:border-[#14120C] focus:ring-2 focus:ring-[#14120C]/15 outline-none text-slate-900 placeholder:text-slate-300 transition-all"
              />

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={onBackToPhone}
                  className="font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Change phone number
                </button>
                <button
                  type="button"
                  onClick={onResendOtp}
                  disabled={otpSending}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer disabled:opacity-50"
                >
                  {otpSending ? 'Resending...' : 'Resend code'}
                </button>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || otpSending}
                className="w-full h-11 rounded-lg bg-[#14120C] hover:bg-black active:scale-[0.99] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Emergency Contacts */}
          {activeStepIndex === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Emergency contacts</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Add trusted family or friends who receive live GPS alerts during emergencies.
                </p>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {emergencyContacts.map((contact, index) => {
                  const phoneDigits = contact.phone.replace(/\D/g, '');
                  const phoneTouched = phoneDigits.length > 0;
                  const phoneInvalid = phoneTouched && phoneDigits.length !== 10;

                  return (
                    <div key={contact.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => onUpdateEmergencyContact?.(contact.id, 'name', e.target.value)}
                            placeholder="Full name"
                            className="w-full h-10 px-3 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 outline-none focus:border-[#14120C] focus:ring-2 focus:ring-[#14120C]/15"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Mobile</label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={contact.phone}
                            onChange={(e) =>
                              onUpdateEmergencyContact?.(contact.id, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                            }
                            placeholder="10-digit number"
                            className={`w-full h-10 px-3 rounded-lg bg-white border text-sm text-slate-900 outline-none focus:ring-2 ${
                              phoneInvalid
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                                : 'border-slate-300 focus:border-[#14120C] focus:ring-[#14120C]/15'
                            }`}
                          />
                          {phoneInvalid && (
                            <p className="mt-1 text-[11px] font-medium text-rose-600">Enter a valid 10-digit number</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Relationship</label>
                        <div className="flex flex-wrap gap-2">
                          {RELATIONSHIP_PRESETS.map((label) => {
                            const isPicked = contact.relationship === label;
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => onUpdateEmergencyContact?.(contact.id, 'relationship', label)}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                  isPicked
                                    ? 'border border-[#14120C] bg-[#14120C]/5 text-[#14120C] font-semibold'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-400 font-medium'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {onAddEmergencyContact && (
                <button
                  type="button"
                  onClick={onAddEmergencyContact}
                  className="w-full h-11 rounded-lg border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus size={15} />
                  <span>Add another contact</span>
                </button>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={onFinishEmergencyContacts}
                disabled={isProcessing}
                className="w-full h-11 rounded-lg bg-[#14120C] hover:bg-black active:scale-[0.99] text-white font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Activating...</span>
                  </>
                ) : (
                  <span>Save &amp; activate tag</span>
                )}
              </button>
              {onSkipEmergencyContacts && (
                <button
                  type="button"
                  onClick={onSkipEmergencyContacts}
                  disabled={isProcessing}
                  className="w-full text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              )}
            </div>
          )}

          {/* STEP 4: Done */}
          {activeStepIndex === 3 && (
            <div className="text-center space-y-5 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">All set! Tag is live</h2>
              <button
                type="button"
                onClick={onViewTag}
                className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg bg-[#14120C] hover:bg-black active:scale-[0.99] text-white font-semibold text-sm transition-all cursor-pointer"
              >
                <span>View public scan tag</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <ScanExitConfirmModal
        isOpen={showExitModal}
        onContinuePayment={() => setShowExitModal(false)}
        onConfirmExit={handleConfirmExit}
        onViewTag={activeStepIndex >= 2 ? onViewTag : undefined}
      />
    </div>
  );
}
