import React, { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound, Mail, Smartphone, Loader2, Check, Copy, Bell, Save, Lock, User, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { apiClient, isApiBackendConfigured } from '../../../lib/apiClient';
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush } from '../../../lib/push';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';
import { sendMsg91Otp, verifyMsg91Otp, retryMsg91Otp, toMsg91Identifier } from '../../../lib/msg91Widget';

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-lg outline-none focus:border-[var(--fx-ink)] transition-colors';
const labelCls = 'block text-xs font-bold text-[var(--fx-ink-2)] mb-1';
const cardCls = 'bg-white border border-[var(--fx-border)] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs';

function Banner({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  return (
    <div className={`text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-2 ${tone === 'success' ? 'bg-[#DCFCE7] text-[#16A34A] border border-emerald-200' : 'bg-[#FEE2E2] text-[#DC2626] border border-red-200'}`}>
      {tone === 'error' && <AlertCircle size={14} className="shrink-0" />}
      {tone === 'success' && <Check size={14} className="shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

export default function AccountSettingsPanel({
  showToast,
  onAccountDeleted,
  onProductsLinked,
}: {
  showToast: (msg: string) => void;
  onAccountDeleted?: () => void;
  onProductsLinked?: () => Promise<any> | void;
}) {
  const { profile, refreshProfile, isAdmin } = useAuth();

  if (!isApiBackendConfigured) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fx-ink)]">Account Settings</h1>
        </div>
        <div className={cardCls}>
          <p className="text-sm text-[var(--fx-ink-2)]">
            Account settings require the RapiQR backend to be connected. Configure <code className="text-xs bg-[var(--fx-canvas)] px-1.5 py-0.5 rounded">VITE_API_BASE_URL</code> to enable this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fx-ink)]">Account Settings</h1>
      </div>

      {/* SINGLE UNIFIED ACCOUNT DETAILS FORM WITH SINGLE SAVE BUTTON */}
      <UnifiedAccountForm
        profile={profile}
        refreshProfile={refreshProfile}
        showToast={showToast}
        onProductsLinked={onProductsLinked}
        isAdmin={isAdmin}
      />

      {/* PASSWORD CHANGE & PHONE OTP RESET SECTION */}
      <PasswordSecuritySection profile={profile} showToast={showToast} />

      {/* SECURITY CONTROLS */}
      <TwoFactorSection profile={profile} refreshProfile={refreshProfile} showToast={showToast} />
      <PushNotificationsSection showToast={showToast} />

      {!isAdmin && <DangerZoneSection onAccountDeleted={onAccountDeleted} />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * UNIFIED ACCOUNT SETTINGS FORM (Name, Email, Password with SINGLE save button)
 * ────────────────────────────────────────────────────────────────────────── */
function UnifiedAccountForm({
  profile,
  refreshProfile,
  showToast,
  onProductsLinked,
  isAdmin,
}: {
  profile: any;
  refreshProfile: () => Promise<void>;
  showToast: (msg: string) => void;
  onProductsLinked?: () => Promise<any> | void;
  isAdmin?: boolean;
}) {
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();

  // Basic Details
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [email, setEmail] = useState(profile?.email || '');

  // Password confirmation for email changes
  const [currentPassword, setCurrentPassword] = useState('');

  // Status & feedback
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  // Phone verification state
  const [showPhoneChanger, setShowPhoneChanger] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [loadingStickers, setLoadingStickers] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Keep state synced if profile updates externally
  useEffect(() => {
    if (profile?.fullName) setFullName(profile.fullName);
    if (profile?.email) setEmail(profile.email);
  }, [profile?.fullName, profile?.email]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => setResendCountdown((c) => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleLoadStickers = async () => {
    setLoadingStickers(true);
    await onProductsLinked?.();
    setLoadingStickers(false);
    showToast('Stickers linked to your phone number are up to date');
  };

  const handleSendOtp = async () => {
    if (!phoneDraft.trim()) {
      setPhoneMsg({ tone: 'error', text: 'Enter a valid phone number first.' });
      return;
    }
    setPhoneBusy(true);
    setPhoneMsg(null);
    const res = await sendPhoneOtp(phoneDraft.trim());
    if (!res.success) {
      setPhoneBusy(false);
      setPhoneMsg({ tone: 'error', text: res.error || 'Failed to send code.' });
      return;
    }
    try {
      await sendMsg91Otp(toMsg91Identifier(phoneDraft));
      setOtpCode('');
      setOtpStep(true);
      setResendCountdown(30);
      setPhoneMsg({ tone: 'success', text: 'Verification code sent to your phone.' });
    } catch (err: any) {
      setPhoneMsg({ tone: 'error', text: err?.message || 'Failed to send verification code.' });
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || phoneBusy) return;
    setPhoneMsg(null);
    try {
      await retryMsg91Otp();
      setResendCountdown(30);
      setPhoneMsg({ tone: 'success', text: 'Code resent.' });
    } catch (err: any) {
      setPhoneMsg({ tone: 'error', text: err?.message || 'Failed to resend code.' });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setPhoneMsg({ tone: 'error', text: 'Enter the verification code.' });
      return;
    }
    setPhoneBusy(true);
    setPhoneMsg(null);
    try {
      const accessToken = await verifyMsg91Otp(otpCode.trim());
      const res = await verifyPhoneOtp(accessToken);
      if (!res.success) {
        setPhoneMsg({ tone: 'error', text: res.error || 'Verification failed.' });
        return;
      }
      await refreshProfile();
      if (res.claimedCount) onProductsLinked?.();
      setOtpStep(false);
      setShowPhoneChanger(false);
      setPhoneDraft('');
      setPhoneMsg({
        tone: 'success',
        text: res.claimedCount ? `Phone verified! ${res.claimedCount} sticker(s) linked.` : 'Phone number verified.',
      });
      showToast('Phone number verified successfully');
    } catch (err: any) {
      setPhoneMsg({ tone: 'error', text: err?.message || 'Incorrect verification code.' });
    } finally {
      setPhoneBusy(false);
    }
  };

  // UNIFIED SUBMIT HANDLER — Updates name, email, and password in ONE unified action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const nameChanged = fullName.trim() !== (profile?.fullName || '');
    const emailChanged = email.trim() !== (profile?.email || '');

    if (!nameChanged && !emailChanged) {
      setMsg({ tone: 'success', text: 'No changes detected.' });
      return;
    }

    // Validation checks
    if (!fullName.trim()) {
      setMsg({ tone: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    if (emailChanged) {
      if (!email.includes('@') || !email.includes('.')) {
        setMsg({ tone: 'error', text: 'Please enter a valid email address.' });
        return;
      }
      if (!isAdmin && !currentPassword) {
        setMsg({ tone: 'error', text: 'Please enter your current password to confirm email change.' });
        return;
      }
    }

    setSaving(true);
    const updatesDone: string[] = [];

    try {
      // 1. Update Profile (Name)
      if (nameChanged) {
        await apiClient.auth.updateProfile({ fullName: fullName.trim() });
        updatesDone.push('name');
      }

      // 2. Update Email if changed
      if (emailChanged) {
        const res = await apiClient.auth.changeEmail(email.trim(), currentPassword);
        if (res.token) {
          localStorage.setItem('repiqr-token', res.token);
          localStorage.setItem('namoqr-token', res.token);
        }
        updatesDone.push('email');
        setCurrentPassword('');
      }

      await refreshProfile();
      setMsg({
        tone: 'success',
        text: `Profile updated successfully (${updatesDone.join(', ')}).`,
      });
      showToast('Profile details saved successfully');
    } catch (err: any) {
      setMsg({ tone: 'error', text: err?.message || 'Failed to save account changes.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between border-b border-[var(--fx-border)] pb-4">
        <div>
          <h2 className="font-bold text-base text-[var(--fx-ink)] flex items-center gap-2">
            <User size={16} /> Account Information
          </h2>
          <p className="text-xs text-[var(--fx-ink-2)] mt-0.5">
            Update your profile, login email, and security credentials below.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
          {profile?.role === 'admin' ? 'Admin Account' : 'Standard Account'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ROW 1: FULL NAME & EMAIL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              type="text"
              className={inputCls}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className={labelCls}>Login Email</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </div>
        </div>

        {/* ROW 2: PHONE NUMBER & LINKED STICKERS */}
        <div className="rounded-lg bg-[var(--fx-canvas)] p-4 border border-[var(--fx-border)] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className={labelCls}>Linked Mobile Phone</span>
              {profile?.phoneNumber ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[var(--fx-ink)]">{profile.phoneNumber}</span>
                  {profile.isPhoneVerified ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check size={11} /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      Unverified
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--fx-ink-2)]">No phone number attached yet.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {profile?.phoneNumber && (
                <button
                  type="button"
                  onClick={handleLoadStickers}
                  disabled={loadingStickers}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[var(--fx-border)] text-xs font-semibold text-[var(--fx-ink)] hover:bg-neutral-50 disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  {loadingStickers ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={12} />}
                  <span>Sync Stickers</span>
                </button>
              )}
              {profile?.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => { setShowPhoneChanger(!showPhoneChanger); setPhoneMsg(null); }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--fx-border)] bg-white text-xs font-semibold text-[var(--fx-ink)] hover:bg-neutral-50 cursor-pointer shadow-2xs"
                >
                  {showPhoneChanger ? 'Hide' : profile?.phoneNumber ? 'Change Number' : 'Add Number'}
                </button>
              )}
            </div>
          </div>

          {/* INLINE PHONE CHANGER WIDGET */}
          {showPhoneChanger && (
            <div className="pt-3 border-t border-[var(--fx-border)] space-y-3">
              {!otpStep ? (
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center max-w-md">
                  <div className="flex-1">
                    <PhoneInputWithCountry
                      value={phoneDraft}
                      onChange={(full) => { setPhoneDraft(full); setPhoneMsg(null); }}
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={phoneBusy}
                    className="px-4 py-2 rounded-lg bg-[var(--fx-ink)] text-white text-xs font-semibold hover:bg-black disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {phoneBusy ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                    <span>Send OTP</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center max-w-md">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setPhoneMsg(null); }}
                    placeholder="Enter 4-digit OTP"
                    className={`${inputCls} font-mono tracking-widest flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={phoneBusy}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {phoneBusy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>Confirm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpStep(false); setPhoneMsg(null); }}
                    className="px-3 py-2 rounded-lg border border-[var(--fx-border)] text-xs font-semibold text-[var(--fx-ink-2)] hover:bg-white cursor-pointer shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {otpStep && (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || phoneBusy}
                  className="text-xs font-semibold text-[var(--fx-accent)] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend OTP'}
                </button>
              )}

              {phoneMsg && <Banner tone={phoneMsg.tone} message={phoneMsg.text} />}
            </div>
          )}
        </div>

        {/* EMAIL CHANGE CONFIRMATION (SHOWN ONLY IF EMAIL CHANGED) */}
        {email.trim() !== (profile?.email || '') && !isAdmin && (
          <div className="border-t border-[var(--fx-border)] pt-4 space-y-2 animate-fade-in max-w-sm">
            <label className={labelCls}>Confirm Current Password (Required to update email)</label>
            <input
              type="password"
              className={inputCls}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
        )}

        {/* FEEDBACK BANNER */}
        {msg && <Banner tone={msg.tone} message={msg.text} />}

        {/* SINGLE SAVE BUTTON */}
        <div className="border-t border-[var(--fx-border)] pt-5 flex items-center justify-between">
          <p className="text-[11px] text-[var(--fx-ink-2)]">
            Account name, login email, and linked phone number.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-2 shadow-xs transition-all"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * PASSWORD CHANGE & PHONE OTP RESET SECTION
 * ────────────────────────────────────────────────────────────────────────── */
function PasswordSecuritySection({ profile, showToast }: { profile: any; showToast: (msg: string) => void }) {
  const [tab, setTab] = useState<'otp' | 'forgot' | 'password'>('otp');
  const [phone, setPhone] = useState(profile?.phoneNumber || '');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (profile?.phoneNumber && !phone) {
      setPhone(profile.phoneNumber);
    }
  }, [profile?.phoneNumber, phone]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleSendOtp = async (targetPhone: string) => {
    const clean = (targetPhone || '').replace(/\D/g, '');
    if (clean.length < 10) {
      setMsg({ tone: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiClient.auth.sendPasswordResetPhoneOtp(targetPhone);
      if (res?.success) {
        setOtpSent(true);
        setCountdown(30);
        setMsg({ tone: 'success', text: `OTP verification code sent to ${targetPhone} via SMS & WhatsApp.` });
        showToast(`Verification code sent to ${targetPhone}`);
      } else {
        setMsg({ tone: 'error', text: res?.error || 'Failed to send OTP code. Please try again.' });
      }
    } catch (err: any) {
      setMsg({ tone: 'error', text: err?.message || 'Failed to send OTP code.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (newPassword.length < 6) {
      setMsg({ tone: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ tone: 'error', text: 'New password and confirmation password do not match.' });
      return;
    }

    if (tab === 'otp' || tab === 'forgot') {
      const targetPhone = (tab === 'otp' ? (profile?.phoneNumber || phone) : phone).trim();
      if (!targetPhone) {
        setMsg({ tone: 'error', text: 'Please enter a valid mobile number.' });
        return;
      }
      if (!otpCode.trim()) {
        setMsg({ tone: 'error', text: 'Please enter the 4-digit verification code.' });
        return;
      }
      setLoading(true);
      try {
        const res = await apiClient.auth.resetPasswordWithPhoneOtp({
          phoneNumber: targetPhone,
          code: otpCode.trim(),
          newPassword,
        });
        if (res?.success) {
          setMsg({ tone: 'success', text: 'Password successfully updated! Your account is secured.' });
          showToast('Password updated successfully');
          setOtpCode('');
          setNewPassword('');
          setConfirmPassword('');
          setOtpSent(false);
        } else {
          setMsg({ tone: 'error', text: res?.error || 'Invalid or expired OTP code.' });
        }
      } catch (err: any) {
        setMsg({ tone: 'error', text: err?.message || 'Failed to reset password.' });
      } finally {
        setLoading(false);
      }
    } else {
      // standard current password change
      if (!currentPassword) {
        setMsg({ tone: 'error', text: 'Please enter your current password.' });
        return;
      }
      setLoading(true);
      try {
        const res = await apiClient.auth.changePassword(currentPassword, newPassword);
        if (res?.success) {
          setMsg({ tone: 'success', text: 'Password updated successfully.' });
          showToast('Password updated successfully');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setMsg({ tone: 'error', text: res?.error || 'Failed to update password.' });
        }
      } catch (err: any) {
        setMsg({ tone: 'error', text: err?.message || 'Incorrect current password or update failed.' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between border-b border-[var(--fx-border)] pb-4">
        <div>
          <h2 className="font-bold text-base text-[var(--fx-ink)] flex items-center gap-2">
            <KeyRound size={17} className="text-[var(--fx-accent)]" /> Password &amp; Security
          </h2>
          <p className="text-xs text-[var(--fx-ink-2)] mt-0.5">
            Reset or change your password with instant mobile OTP verification or current password.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--fx-border)] pb-3">
        <button
          type="button"
          onClick={() => { setTab('otp'); setMsg(null); setOtpSent(false); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'otp'
              ? 'bg-[var(--fx-ink)] text-white shadow-xs'
              : 'border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]'
          }`}
        >
          Verify via Phone OTP
        </button>
        <button
          type="button"
          onClick={() => { setTab('forgot'); setMsg(null); setOtpSent(false); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'forgot'
              ? 'bg-[var(--fx-ink)] text-white shadow-xs'
              : 'border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]'
          }`}
        >
          Forgot Password (Phone Reset)
        </button>
        <button
          type="button"
          onClick={() => { setTab('password'); setMsg(null); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'password'
              ? 'bg-[var(--fx-ink)] text-white shadow-xs'
              : 'border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]'
          }`}
        >
          Use Current Password
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleVerifyAndUpdatePassword} className="space-y-4 pt-1">
        {/* TAB 1: PHONE OTP VERIFICATION */}
        {tab === 'otp' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[var(--fx-canvas)] p-3.5 border border-[var(--fx-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[var(--fx-ink)] flex items-center gap-1.5">
                  <Smartphone size={14} className="text-[var(--fx-accent)]" /> Registered Phone Number
                </span>
                <p className="font-mono text-sm font-bold text-[var(--fx-ink)] mt-0.5">
                  {profile?.phoneNumber || phone || 'No phone attached yet'}
                </p>
                <p className="text-[11px] text-[var(--fx-ink-2)] mt-0.5">
                  We will send a one-time code to verify your phone before setting your new password.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp(phone || profile?.phoneNumber || '')}
                    disabled={loading || !(phone || profile?.phoneNumber)}
                    className="px-4 py-2 rounded-lg bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
                    <span>Send Verification OTP</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp(phone || profile?.phoneNumber || '')}
                    disabled={loading || countdown > 0}
                    className="px-3 py-1.5 rounded-lg border border-[var(--fx-border)] bg-white text-xs font-semibold text-[var(--fx-ink)] hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 animate-fade-in">
                <div>
                  <label className={labelCls}>Verification Code (OTP)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter code"
                    className={`${inputCls} font-mono tracking-widest`}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FORGOT PASSWORD (PHONE NUMBER RESET) */}
        {tab === 'forgot' && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--fx-ink-2)]">
              Enter your mobile phone number to verify identity and reset your password right now without knowing your old password.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
              <div className="flex-1">
                <PhoneInputWithCountry
                  value={phone}
                  onChange={(val) => { setPhone(val); setMsg(null); }}
                  placeholder="10-digit mobile number"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSendOtp(phone)}
                disabled={loading || !phone || countdown > 0}
                className="px-4 py-2.5 rounded-lg bg-[var(--fx-ink)] hover:bg-black text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>{countdown > 0 ? `Wait ${countdown}s` : otpSent ? 'Resend OTP' : 'Send Reset Code'}</span>
              </button>
            </div>

            {otpSent && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 animate-fade-in">
                <div>
                  <label className={labelCls}>Verification Code (OTP)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter code"
                    className={`${inputCls} font-mono tracking-widest`}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CURRENT PASSWORD */}
        {tab === 'password' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className={labelCls}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className={inputCls}
              />
            </div>
          </div>
        )}

        {msg && <Banner tone={msg.tone} message={msg.text} />}

        {((tab === 'password') || (otpSent && (tab === 'otp' || tab === 'forgot'))) && (
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-2 shadow-xs transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              <span>{tab === 'forgot' ? 'Reset Password' : 'Confirm & Update Password'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * TWO FACTOR AUTHENTICATION SECTION (Reduced radius)
 * ────────────────────────────────────────────────────────────────────────── */
function TwoFactorSection({ profile, refreshProfile, showToast }: any) {
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const enabled = Boolean(profile?.twoFactorEnabled);

  const startSetup = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiClient.twoFactor.setup();
      setSetupData({ secret: res.secret || '', otpauthUrl: res.otpauthUrl || '' });
    } catch (err: any) {
      setMsg({ tone: 'error', text: err.message || 'Failed to start 2FA setup' });
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await apiClient.twoFactor.verify(code);
      await refreshProfile();
      setSetupData(null);
      setCode('');
      showToast('Two-factor authentication enabled');
    } catch (err: any) {
      setMsg({ tone: 'error', text: err.message || 'Invalid code' });
    } finally {
      setBusy(false);
    }
  };

  const disable2FA = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await apiClient.twoFactor.disable(disablePassword);
      await refreshProfile();
      setShowDisableForm(false);
      setDisablePassword('');
      showToast('Two-factor authentication disabled');
    } catch (err: any) {
      setMsg({ tone: 'error', text: err.message || 'Failed to disable 2FA' });
    } finally {
      setBusy(false);
    }
  };

  const copySecret = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-[var(--fx-ink)] flex items-center gap-2">
          <ShieldCheck size={15} /> Two-Factor Authentication (2FA)
        </h3>
        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${enabled ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {!enabled && !setupData && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--fx-ink-2)]">Add an extra layer of protection using Google Authenticator, Authy, or Microsoft Authenticator.</p>
          <button
            onClick={startSetup}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
          >
            {busy && <Loader2 size={13} className="animate-spin" />} Set Up 2FA
          </button>
        </div>
      )}

      {!enabled && setupData && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--fx-ink-2)]">Enter this secret key in your authenticator app:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono font-bold bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-lg px-3.5 py-2 break-all">
              {setupData.secret}
            </code>
            <button
              onClick={copySecret}
              className="w-9 h-9 flex-shrink-0 rounded-lg bg-[var(--fx-canvas)] border border-[var(--fx-border)] flex items-center justify-center cursor-pointer"
            >
              {copied ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
            </button>
          </div>
          <div>
            <label className={labelCls}>6-digit code from app</label>
            <input
              className={`${inputCls} font-mono tracking-widest`}
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
            />
          </div>
          {msg && <Banner tone={msg.tone} message={msg.text} />}
          <div className="flex gap-2">
            <button
              onClick={() => { setSetupData(null); setCode(''); }}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={verifyCode}
              disabled={busy || code.length !== 6}
              className="flex-1 py-2 rounded-lg bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              {busy && <Loader2 size={13} className="animate-spin" />} Verify &amp; Enable
            </button>
          </div>
        </div>
      )}

      {enabled && !showDisableForm && (
        <button
          onClick={() => setShowDisableForm(true)}
          className="px-4 py-2 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold cursor-pointer"
        >
          Disable 2FA
        </button>
      )}

      {enabled && showDisableForm && (
        <div className="space-y-3">
          <label className={labelCls}>Confirm password to disable 2FA</label>
          <input
            type="password"
            className={inputCls}
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
          />
          {msg && <Banner tone={msg.tone} message={msg.text} />}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowDisableForm(false); setDisablePassword(''); }}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={disable2FA}
              disabled={busy}
              className="flex-1 py-2 rounded-lg bg-[#DC2626] hover:opacity-90 text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {busy && <Loader2 size={13} className="animate-spin" />} Confirm Disable
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * PUSH NOTIFICATIONS SECTION (Reduced radius)
 * ────────────────────────────────────────────────────────────────────────── */
function PushNotificationsSection({ showToast }: any) {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false);
      return;
    }
    getExistingSubscription().then((sub) => setEnabled(Boolean(sub))).catch(() => {});
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setMsg(null);
    const res = await subscribeToPush();
    if (res.success) {
      setEnabled(true);
      showToast('Push notifications enabled');
    } else {
      setMsg({ tone: 'error', text: res.error || 'Failed to enable notifications' });
    }
    setBusy(false);
  };

  const handleDisable = async () => {
    setBusy(true);
    setMsg(null);
    const res = await unsubscribeFromPush();
    if (res.success) {
      setEnabled(false);
      showToast('Push notifications disabled');
    } else {
      setMsg({ tone: 'error', text: res.error || 'Failed to disable notifications' });
    }
    setBusy(false);
  };

  if (!supported) return null;

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-[var(--fx-ink)] flex items-center gap-2">
          <Bell size={15} /> Push Notifications
        </h3>
        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${enabled ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <p className="text-xs text-[var(--fx-ink-2)]">
        Get instant browser alerts when someone scans your tags or sends an emergency message.
      </p>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      {enabled ? (
        <button
          onClick={handleDisable}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
        >
          {busy && <Loader2 size={13} className="animate-spin" />} Turn Off
        </button>
      ) : (
        <button
          onClick={handleEnable}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
        >
          {busy && <Loader2 size={13} className="animate-spin" />} Turn On
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * DANGER ZONE SECTION (Reduced radius)
 * ────────────────────────────────────────────────────────────────────────── */
function DangerZoneSection({ onAccountDeleted }: { onAccountDeleted?: () => void }) {
  const { deleteAccount } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      setMsg(null);
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await deleteAccount();
    setBusy(false);
    if (res.success) {
      onAccountDeleted?.();
    } else {
      setMsg({ tone: 'error', text: res.error || 'Failed to delete account.' });
      setConfirming(false);
    }
  };

  return (
    <div className={`${cardCls} border-[#FECACA]`}>
      <h3 className="font-bold text-sm text-[#DC2626]">Danger Zone</h3>
      <p className="text-xs text-[var(--fx-ink-2)]">
        Permanently delete your account, profile, and all attached safety stickers. This action cannot be undone.
      </p>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      {confirming && !msg && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-center justify-between">
          <p className="text-xs font-semibold text-[#DC2626]">Are you sure? This action is permanent.</p>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] underline cursor-pointer ml-2"
          >
            Cancel
          </button>
        </div>
      )}
      <button
        onClick={handleDelete}
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 w-fit"
      >
        {busy && <Loader2 size={13} className="animate-spin" />} {confirming ? 'Confirm Delete Account' : 'Delete Account'}
      </button>
    </div>
  );
}
