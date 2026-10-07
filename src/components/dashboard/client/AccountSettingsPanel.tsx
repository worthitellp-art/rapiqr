import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Mail, Loader2, Check, Bell, Save, User, RefreshCw, AlertCircle, Camera } from 'lucide-react';
import InitialAvatar from '../../common/InitialAvatar';
import { useAuth } from '../../../context/AuthContext';
import { apiClient, isApiBackendConfigured } from '../../../lib/apiClient';
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush } from '../../../lib/push';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';
import { sendMsg91Otp, verifyMsg91Otp, retryMsg91Otp, toMsg91Identifier } from '../../../lib/msg91Widget';

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-lg outline-none focus:border-[var(--fx-ink)] transition-colors';
const labelCls = 'block text-xs font-bold text-[var(--fx-ink-2)] mb-1';
const cardCls = 'bg-white border border-[var(--fx-border)] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs';

const AVATAR_MAX_SOURCE_BYTES = 8 * 1024 * 1024; // reject obviously-oversized picks before even decoding them

/** Downscales to at most `maxSize`px on the long edge and re-encodes as JPEG — keeps
 * the upload small regardless of what the camera/gallery produced. */
function resizeImageToDataUrl(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not process the image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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

      {/* SECURITY CONTROLS */}
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
  // Deliberately NOT prefilled from profile.email — stays blank unless the
  // user types something, so an untouched blank field is never mistaken for
  // "clear my email" on save (see emailChanged below).
  const [email, setEmail] = useState('');

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

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  // Keep state synced if profile updates externally (email is intentionally
  // excluded — it stays blank unless the user types into it).
  useEffect(() => {
    if (profile?.fullName) setFullName(profile.fullName);
  }, [profile?.fullName]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => setResendCountdown((c) => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarMsg({ tone: 'error', text: 'Please choose an image file.' });
      return;
    }
    if (file.size > AVATAR_MAX_SOURCE_BYTES) {
      setAvatarMsg({ tone: 'error', text: 'That image is too large — please choose one under 8 MB.' });
      return;
    }

    setAvatarUploading(true);
    setAvatarMsg(null);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const res = await apiClient.privacy.uploadAvatar(dataUrl);
      if (!res?.success) throw new Error('Upload failed.');
      await refreshProfile();
      showToast('Profile photo updated');
    } catch (err: any) {
      setAvatarMsg({ tone: 'error', text: err?.message || 'Failed to upload photo.' });
    } finally {
      setAvatarUploading(false);
    }
  };

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
    // An untouched blank field must never be read as "clear my email" —
    // only a non-blank value that actually differs from the saved one counts.
    const emailChanged = email.trim() !== '' && email.trim() !== (profile?.email || '');

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

      {/* PROFILE PHOTO */}
      <div className="flex items-center gap-4">
        <InitialAvatar name={profile?.fullName} email={profile?.email} avatarUrl={profile?.avatarUrl} size={56} />
        <div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarPick}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="px-3.5 py-2 rounded-lg border border-[var(--fx-border)] bg-white text-xs font-semibold text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
          >
            {avatarUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            <span>{avatarUploading ? 'Uploading…' : 'Change photo'}</span>
          </button>
          <p className="text-[11px] text-[var(--fx-ink-2)] mt-1">JPG, PNG, WEBP or GIF, up to 8 MB.</p>
          {avatarMsg && <div className="mt-2"><Banner tone={avatarMsg.tone} message={avatarMsg.text} /></div>}
        </div>
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
        {email.trim() !== '' && email.trim() !== (profile?.email || '') && !isAdmin && (
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
  const { sendDeleteAccountOtp, deleteAccount } = useAuth();
  // idle → confirm (warning) → otp (code sent, waiting to verify)
  const [stage, setStage] = useState<'idle' | 'confirm' | 'otp'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const handleSendOtp = async () => {
    setBusy(true);
    setMsg(null);
    const res = await sendDeleteAccountOtp();
    setBusy(false);
    if (res.success) {
      setStage('otp');
      setMsg({ tone: 'success', text: 'Verification code sent to your phone.' });
    } else {
      setMsg({ tone: 'error', text: res.error || 'Failed to send verification code.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!otpCode.trim()) {
      setMsg({ tone: 'error', text: 'Enter the verification code sent to your phone.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await deleteAccount(otpCode.trim());
    setBusy(false);
    if (res.success) {
      onAccountDeleted?.();
    } else {
      setMsg({ tone: 'error', text: res.error || 'Failed to delete account.' });
    }
  };

  const handleCancel = () => {
    setStage('idle');
    setOtpCode('');
    setMsg(null);
  };

  return (
    <div className={`${cardCls} border-[#FECACA]`}>
      <h3 className="font-bold text-sm text-[#DC2626]">Danger Zone</h3>
      <p className="text-xs text-[var(--fx-ink-2)]">
        Permanently delete your account, profile, and all attached safety stickers. This action cannot be undone.
      </p>
      {msg && <Banner tone={msg.tone} message={msg.text} />}

      {stage === 'confirm' && !msg && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-[#DC2626]">Are you sure? This action is permanent. We'll text a verification code to your phone first.</p>
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] underline cursor-pointer ml-2 shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      {stage === 'otp' && (
        <div className="space-y-2.5 max-w-xs">
          <label className={labelCls}>Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            autoFocus
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Enter 4-digit code"
            className={`${inputCls} font-mono tracking-widest`}
          />
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={busy}
            className="text-xs font-semibold text-[var(--fx-accent)] hover:underline disabled:opacity-50 cursor-pointer"
          >
            Resend code
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {stage === 'idle' && (
          <button
            onClick={() => setStage('confirm')}
            className="px-4 py-2 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold cursor-pointer flex items-center gap-1.5 w-fit"
          >
            Delete Account
          </button>
        )}
        {stage === 'confirm' && (
          <button
            onClick={handleSendOtp}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 w-fit"
          >
            {busy && <Loader2 size={13} className="animate-spin" />} Send Verification Code
          </button>
        )}
        {stage === 'otp' && (
          <>
            <button
              onClick={handleConfirmDelete}
              disabled={busy || otpCode.trim().length < 4}
              className="px-4 py-2 rounded-lg bg-[#DC2626] hover:opacity-90 text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 w-fit"
            >
              {busy && <Loader2 size={13} className="animate-spin" />} Confirm Delete Account
            </button>
            <button
              onClick={handleCancel}
              className="text-xs text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] underline cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
