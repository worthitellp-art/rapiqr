import React, { useState } from 'react';
import { ShieldCheck, Loader2, Check, X, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';
import { sendMsg91Otp, verifyMsg91Otp, toMsg91Identifier } from '../../../lib/msg91Widget';

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl outline-none focus:border-[var(--fx-ink)]';

/**
 * Signing in with only an email or only a phone number leaves the other half
 * of the account unset — but stickers auto-link by phone on activation, and
 * emergency contacts/receipts need a real email. Nag until both are present
 * rather than silently letting the profile stay half-filled.
 */
export default function CompleteProfilePopup({
  missingPhone,
  missingEmail,
  onDismiss,
  onGoToSettings,
  onProductsLinked,
}: {
  missingPhone: boolean;
  missingEmail: boolean;
  onDismiss: () => void;
  onGoToSettings: () => void;
  onProductsLinked?: () => Promise<any> | void;
}) {
  const { profile, sendPhoneOtp, verifyPhoneOtp, refreshProfile } = useAuth();

  const [phoneDraft, setPhoneDraft] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [done, setDone] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneDraft.trim()) {
      setMsg({ tone: 'error', text: 'Enter a phone number first.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await sendPhoneOtp(phoneDraft.trim());
    if (!res.success) {
      setBusy(false);
      setMsg({ tone: 'error', text: res.error || 'Failed to send code.' });
      return;
    }
    try {
      // Pre-check passed — the MSG91 widget actually sends the OTP.
      await sendMsg91Otp(toMsg91Identifier(phoneDraft));
      setOtpCode('');
      setOtpStep(true);
      setMsg({ tone: 'success', text: 'Code sent! Enter it below.' });
    } catch (err: any) {
      setMsg({ tone: 'error', text: err?.message || 'Failed to send the verification code.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDismissForever = () => {
    try {
      localStorage.setItem('rapiqr-phone-asked-once', 'true');
    } catch {
      // Ignore storage errors
    }
    onDismiss();
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setMsg({ tone: 'error', text: 'Enter the code sent to your phone.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    let res;
    try {
      const accessToken = await verifyMsg91Otp(otpCode.trim());
      res = await verifyPhoneOtp(accessToken);
    } catch (err: any) {
      setBusy(false);
      setMsg({ tone: 'error', text: err?.message || 'Incorrect code — please try again.' });
      return;
    }
    setBusy(false);
    if (!res.success) {
      setMsg({ tone: 'error', text: res.error || 'Verification failed.' });
      return;
    }

    // Mark as filled so user is never asked for a phone number again
    try {
      localStorage.setItem('rapiqr-phone-number-filled', 'true');
      localStorage.setItem('rapiqr-phone-asked-once', 'true');
    } catch {
      // Ignore storage errors
    }

    await refreshProfile();
    await onProductsLinked?.();
    if (!missingEmail) {
      setDone(true);
      setTimeout(onDismiss, 1200);
    } else {
      setMsg({ tone: 'success', text: 'Phone verified! Add an email next in Account Settings to finish.' });
    }
  };

  return (
    <div
      className="fx-shell fixed inset-0 z-[130] flex items-center justify-center p-4 text-[var(--fx-ink)]"
      style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100 relative">
        <button
          onClick={handleDismissForever}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--fx-canvas)] flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[var(--fx-amber-soft)] text-[var(--fx-amber)] flex items-center justify-center mb-4">
          <ShieldCheck size={22} />
        </div>
        <h3 className="font-bold text-lg text-[var(--fx-ink)]">
          {missingPhone && !missingEmail ? 'Enter your phone number to get your stickers' : 'Finish setting up your account'}
        </h3>

        <p className="text-xs text-[var(--fx-ink-2)] mt-1 mb-5">
          {missingPhone && !missingEmail
            ? "Stickers auto-link to your account by phone number — add and verify yours to see everything registered under it."
            : `You signed in with just ${missingPhone && !missingEmail ? 'an email' : missingEmail && !missingPhone ? 'a phone number' : 'one contact method'} — add${missingPhone && missingEmail ? ' both a phone number and an email' : missingPhone ? ' a phone number' : ' an email'} so stickers can auto-link and emergency contacts can reach you.`}
        </p>

        {done ? (
          <div className="flex items-center gap-2 text-sm font-bold text-[#16A34A] bg-[#DCFCE7] rounded-xl px-4 py-3">
            <Check size={16} /> Profile completed!
          </div>
        ) : (
          <div className="space-y-4">
            {missingPhone && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[var(--fx-ink-2)] flex items-center gap-1.5">
                  <Smartphone size={13} /> Phone Number
                </label>
                {!otpStep ? (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <PhoneInputWithCountry
                      value={phoneDraft}
                      onChange={(full) => { setPhoneDraft(full); setMsg(null); }}
                      placeholder="10-digit mobile"
                    />
                    <button
                      onClick={handleSendOtp}
                      disabled={busy}
                      className="px-4 py-2.5 rounded-xl bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0 shadow-sm shadow-[var(--fx-accent)]/20 transition-all"
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Verify
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMsg(null); }}
                      placeholder="Enter code"
                      className={`${inputCls} font-mono tracking-widest`}
                    />
                    <button
                      onClick={handleVerifyOtp}
                      disabled={busy}
                      className="px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Confirm
                    </button>
                  </div>
                )}
              </div>
            )}

            {missingEmail && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--fx-ink-2)] flex items-center gap-1.5">
                  <Mail size={13} /> Email Address
                </label>
                <p className="text-xs text-[var(--fx-ink-2)]">
                  {profile?.email ? `Current: ${profile.email}` : 'No email on file yet.'} Add or update it from Account Settings.
                </p>
              </div>
            )}

            {msg && (
              <div className={`text-xs font-bold px-3.5 py-2.5 rounded-xl ${msg.tone === 'success' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                {msg.text}
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={onGoToSettings}
                className="flex-1 py-2.5 rounded-xl bg-[var(--fx-canvas)] border border-[var(--fx-border)] text-xs font-bold text-[var(--fx-ink)] hover:bg-[var(--fx-border)] cursor-pointer"
              >
                Go to Account Settings
              </button>
              <button onClick={onDismiss} className="px-4 py-2.5 text-xs font-bold text-[var(--fx-faint)] hover:text-[var(--fx-ink-2)] cursor-pointer">
                Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
