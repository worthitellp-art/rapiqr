import React, { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound, Mail, Smartphone, Loader2, Check, Copy, Bell } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { apiClient, isApiBackendConfigured } from '../../../lib/apiClient';
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush } from '../../../lib/push';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';
import { sendMsg91Otp, verifyMsg91Otp, retryMsg91Otp, toMsg91Identifier } from '../../../lib/msg91Widget';

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl outline-none focus:border-[var(--fx-ink)]';
const labelCls = 'block text-xs font-bold text-[var(--fx-ink-2)] mb-1';
const cardCls = 'bg-white border border-[var(--fx-border)] rounded-2xl p-5 sm:p-6 space-y-4';

function Banner({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  return (
    <div className={`text-xs font-bold px-3.5 py-2.5 rounded-xl ${tone === 'success' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
      {message}
    </div>
  );
}

export default function AccountSettingsPanel({ showToast, onAccountDeleted, onProductsLinked }: { showToast: (msg: string) => void; onAccountDeleted?: () => void; onProductsLinked?: () => Promise<any> | void }) {
  const { profile, refreshProfile, isAdmin } = useAuth();

  if (!isApiBackendConfigured) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fx-ink)]">Account Settings</h1>
          <p className="text-xs sm:text-sm text-[var(--fx-ink-2)] mt-1">Manage your name, phone, email, password and security options.</p>
        </div>
        <div className={cardCls}>
          <p className="text-sm text-[var(--fx-ink-2)]">
            Account settings (email/password/2FA changes) require the RapiQR backend to be connected. Configure <code className="text-xs bg-[var(--fx-canvas)] px-1.5 py-0.5 rounded">VITE_API_BASE_URL</code> to enable this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fx-ink)]">Account Settings</h1>
        <p className="text-sm text-[var(--fx-ink-2)] mt-1">Manage your account details, contact info, and security credentials.</p>
      </div>

      <ProfileForm profile={profile} refreshProfile={refreshProfile} showToast={showToast} onProductsLinked={onProductsLinked} />
      <EmailForm profile={profile} refreshProfile={refreshProfile} showToast={showToast} />
      <PasswordForm showToast={showToast} />
      <TwoFactorSection profile={profile} refreshProfile={refreshProfile} showToast={showToast} />
      <PushNotificationsSection showToast={showToast} />
      {/* No Danger Zone for the admin account — the server refuses to delete it
          (deleting it would unlink every sticker it touches and lock the fleet
          console out), so offering the button would only ever produce an error. */}
      {!isAdmin && <DangerZoneSection onAccountDeleted={onAccountDeleted} />}
    </div>
  );
}

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
        Permanently delete your account, profile, and every sticker linked to it. This cannot be undone.
      </p>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      {confirming && !msg && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center justify-between">
          <p className="text-xs font-semibold text-[#DC2626]">Are you sure? This action is permanent and cannot be undone.</p>
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
        className="px-5 py-2.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 w-fit"
      >
        {busy && <Loader2 size={13} className="animate-spin" />} {confirming ? 'Confirm Delete Account' : 'Delete Account'}
      </button>
    </div>
  );
}

function ProfileForm({ profile, refreshProfile, showToast, onProductsLinked }: any) {
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const handleSaveName = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.auth.updateProfile({ fullName });
      await refreshProfile();
      setMsg({ tone: 'success', text: 'Name updated.' });
      showToast('Profile updated successfully');
    } catch (err: any) {
      setMsg({ tone: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  // Phone number is OTP-verified before it's ever attached to the account —
  // otherwise anyone could type in a stranger's number here and silently
  // auto-claim any sticker registered under it.
  const [phoneDraft, setPhoneDraft] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [loadingStickers, setLoadingStickers] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

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
      setPhoneMsg({ tone: 'error', text: 'Enter a phone number first.' });
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
      // Pre-check passed — the MSG91 widget actually sends the OTP.
      await sendMsg91Otp(toMsg91Identifier(phoneDraft));
      setOtpCode('');
      setOtpStep(true);
      setResendCountdown(30);
      setPhoneMsg({ tone: 'success', text: 'Code sent! Enter the verification code below.' });
    } catch (err: any) {
      setPhoneMsg({ tone: 'error', text: err?.message || 'Failed to send the verification code.' });
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
      setPhoneMsg({ tone: 'error', text: err?.message || 'Failed to resend the code.' });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setPhoneMsg({ tone: 'error', text: 'Enter the code sent to your phone.' });
      return;
    }
    setPhoneBusy(true);
    setPhoneMsg(null);
    let res;
    try {
      const accessToken = await verifyMsg91Otp(otpCode.trim());
      res = await verifyPhoneOtp(accessToken);
    } catch (err: any) {
      setPhoneBusy(false);
      setPhoneMsg({ tone: 'error', text: err?.message || 'Incorrect code — please try again.' });
      return;
    }
    setPhoneBusy(false);
    if (!res.success) {
      setPhoneMsg({ tone: 'error', text: res.error || 'Verification failed.' });
      return;
    }
    await refreshProfile();
    if (res.claimedCount) onProductsLinked?.();
    setOtpStep(false);
    setPhoneDraft('');
    setPhoneMsg({
      tone: 'success',
      text: res.claimedCount ? `Phone verified! ${res.claimedCount} sticker(s) linked to your account.` : 'Phone number verified.',
    });
    showToast('Phone number verified');
  };

  return (
    <div className={cardCls}>
      <h3 className="font-bold text-sm text-[var(--fx-ink)] flex items-center gap-2"><Smartphone size={15} /> Profile</h3>

      <div className="max-w-sm">
        <label className={labelCls}>Full Name</label>
        <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      <button
        onClick={handleSaveName}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-[var(--fx-accent)]/20 transition-all"
      >
        {saving && <Loader2 size={13} className="animate-spin" />} Save Name
      </button>

      {/* The admin account has no phone number. The fleet console already sees every
          sticker, so a number on this account would only compete with the real owner
          for the stickers registered under it — the server rejects it outright. */}
      {profile?.role === 'admin' ? (
        <div className="pt-4 border-t border-[var(--fx-border)]">
          <p className="text-xs text-[var(--fx-ink-2)]">
            The admin account doesn't use a phone number — the Fleet console lists every sticker regardless of who owns it.
          </p>
        </div>
      ) : (
      <div className="pt-4 border-t border-[var(--fx-border)] space-y-3">
        <div className="flex items-center justify-between">
          <label className={`${labelCls} mb-0`}>Phone Number <span className="text-[var(--fx-red)]">*</span></label>
          {profile?.phoneNumber && profile?.isPhoneVerified ? (
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--fx-green)] flex items-center gap-1">
              <Check size={11} /> Verified
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--fx-amber)] font-bold flex items-center gap-1">
              ⚠ Unverified (OTP Required)
            </span>
          )}
        </div>
        {profile?.phoneNumber && !otpStep && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-mono font-bold text-[var(--fx-ink)]">{profile.phoneNumber}</p>
            <button
              onClick={handleLoadStickers}
              disabled={loadingStickers}
              className="px-3.5 py-2 rounded-xl bg-[var(--fx-canvas)] border border-[var(--fx-border)] text-xs font-bold text-[var(--fx-ink)] hover:bg-[var(--fx-border)] disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
            >
              {loadingStickers ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Load Stickers
            </button>
          </div>
        )}
        {!profile?.phoneNumber && (
          <p className="text-xs text-[var(--fx-ink-2)]">
            A verified phone number is required — it's what your stickers auto-link to the first time they're scanned and activated.
          </p>
        )}

        {!otpStep ? (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-sm">
            <PhoneInputWithCountry
              value={phoneDraft}
              onChange={(full) => { setPhoneDraft(full); setPhoneMsg(null); }}
              placeholder={profile?.phoneNumber ? 'Enter new number to change' : '10-digit mobile'}
            />
            <button
              onClick={handleSendOtp}
              disabled={phoneBusy}
              className="px-4 py-2.5 rounded-xl bg-[var(--fx-canvas)] border border-[var(--fx-border)] text-xs font-bold text-[var(--fx-ink)] hover:bg-[var(--fx-border)] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              {phoneBusy ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
              {profile?.phoneNumber ? 'Verify New Number' : 'Verify Number'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-sm">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={otpCode}
              onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setPhoneMsg(null); }}
              placeholder="Enter code"
              className={`${inputCls} font-mono tracking-widest`}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={phoneBusy}
              className="px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              {phoneBusy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Verify
            </button>
            <button
              onClick={() => { setOtpStep(false); setPhoneMsg(null); }}
              className="px-3 py-2.5 rounded-xl border border-[var(--fx-border)] text-xs font-bold text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer flex-shrink-0"
            >
              Cancel
            </button>
          </div>
        )}
        {otpStep && (
          <button
            onClick={handleResendOtp}
            disabled={resendCountdown > 0 || phoneBusy}
            className="text-xs font-bold text-[var(--fx-accent)] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
          >
            {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
          </button>
        )}
        {phoneMsg && <Banner tone={phoneMsg.tone} message={phoneMsg.text} />}
      </div>
      )}
    </div>
  );
}

function EmailForm({ profile, refreshProfile, showToast }: any) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  // The admin signs in against ADMIN_EMAIL/ADMIN_PASSWORD from the server env, not a
  // stored account password — there is nothing for a re-entry check to verify, so
  // the server skips it for admin and this form drops the field to match.
  const isAdminAccount = profile?.role === 'admin';

  const handleSave = async () => {
    if (!newEmail.includes('@')) {
      setMsg({ tone: 'error', text: 'Enter a valid email address.' });
      return;
    }
    if (!isAdminAccount && !currentPassword) {
      setMsg({ tone: 'error', text: 'Enter your current password to confirm.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiClient.auth.changeEmail(newEmail, currentPassword);
      if (res.token) {
        localStorage.setItem('repiqr-token', res.token);
        localStorage.setItem('namoqr-token', res.token);
      }
      await refreshProfile();
      // The server sends `warning` when the changed address was the one ADMIN_EMAIL
      // still points at — admin login keeps using the old address until Server/.env
      // is updated, and silently letting that surprise them later is worse than a banner.
      setMsg(res.warning
        ? { tone: 'error', text: res.warning }
        : { tone: 'success', text: 'Email updated.' });
      showToast('Email address updated');
      setNewEmail('');
      setCurrentPassword('');
    } catch (err: any) {
      setMsg({ tone: 'error', text: err.message || 'Failed to change email' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cardCls}>
      <h3 className="font-bold text-sm text-[var(--fx-ink)] flex items-center gap-2"><Mail size={15} /> Email Address</h3>
      <p className="text-xs text-[var(--fx-ink-2)]">Current: <span className="font-semibold text-[var(--fx-ink)]">{profile?.email}</span></p>
      <div className={isAdminAccount ? 'max-w-sm' : 'grid sm:grid-cols-2 gap-3.5'}>
        <div>
          <label className={labelCls}>New Email</label>
          <input className={inputCls} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" />
        </div>
        {!isAdminAccount && (
          <div>
            <label className={labelCls}>Current Password</label>
            <input type="password" className={inputCls} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
        )}
      </div>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-[var(--fx-accent)]/20 transition-all"
      >
        {saving && <Loader2 size={13} className="animate-spin" />} Update Email
      </button>
    </div>
  );
}

function PasswordForm({ showToast }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    if (newPassword.length < 6) {
      setMsg({ tone: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ tone: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.auth.changePassword(currentPassword, newPassword);
      setMsg({ tone: 'success', text: 'Password changed.' });
      showToast('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg({ tone: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cardCls}>
      <h3 className="font-bold text-sm text-[var(--fx-ink)] flex items-center gap-2"><KeyRound size={15} /> Change Password</h3>
      <div className="grid sm:grid-cols-3 gap-3.5">
        <div>
          <label className={labelCls}>Current Password</label>
          <input type="password" className={inputCls} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>New Password</label>
          <input type="password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Confirm New Password</label>
          <input type="password" className={inputCls} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
      </div>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-[var(--fx-accent)]/20 transition-all"
      >
        {saving && <Loader2 size={13} className="animate-spin" />} Change Password
      </button>
    </div>
  );
}

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
        <h3 className="font-bold text-sm text-[var(--fx-ink)] flex items-center gap-2"><ShieldCheck size={15} /> Two-Factor Authentication (2FA)</h3>
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${enabled ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {!enabled && !setupData && (
        <>
          <p className="text-xs text-[var(--fx-ink-2)]">Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc).</p>
          <button onClick={startSetup} disabled={busy} className="px-5 py-2.5 rounded-xl bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-[var(--fx-accent)]/20 transition-all">
            {busy && <Loader2 size={13} className="animate-spin" />} Set Up 2FA
          </button>
        </>
      )}

      {!enabled && setupData && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--fx-ink-2)]">Scan-free setup: open your authenticator app, choose "Enter a setup key manually", and enter this key:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono font-bold bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-xl px-3.5 py-2.5 break-all">{setupData.secret}</code>
            <button onClick={copySecret} className="w-10 h-10 flex-shrink-0 rounded-xl bg-[var(--fx-canvas)] border border-[var(--fx-border)] flex items-center justify-center cursor-pointer">
              {copied ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
            </button>
          </div>
          <div>
            <label className={labelCls}>Enter the 6-digit code from your app</label>
            <input className={`${inputCls} font-mono tracking-widest`} maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
          </div>
          {msg && <Banner tone={msg.tone} message={msg.text} />}
          <div className="flex gap-2">
            <button onClick={() => { setSetupData(null); setCode(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
            <button onClick={verifyCode} disabled={busy || code.length !== 6} className="flex-1 py-2.5 rounded-xl bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-[var(--fx-accent)]/20 transition-all">
              {busy && <Loader2 size={13} className="animate-spin" />} Verify & Enable
            </button>
          </div>
        </div>
      )}

      {enabled && !showDisableForm && (
        <button onClick={() => setShowDisableForm(true)} className="px-5 py-2.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold cursor-pointer">
          Disable 2FA
        </button>
      )}

      {enabled && showDisableForm && (
        <div className="space-y-3">
          <label className={labelCls}>Confirm your password to disable 2FA</label>
          <input type="password" className={inputCls} value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
          {msg && <Banner tone={msg.tone} message={msg.text} />}
          <div className="flex gap-2">
            <button onClick={() => { setShowDisableForm(false); setDisablePassword(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
            <button onClick={disable2FA} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-[#DC2626] hover:opacity-90 text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5">
              {busy && <Loader2 size={13} className="animate-spin" />} Confirm Disable
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Nothing useful to show a visitor on a browser that can't do Web Push at all.
  if (!supported) return null;

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-[var(--fx-ink)] flex items-center gap-2"><Bell size={15} /> Push Notifications</h3>
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${enabled ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[var(--fx-canvas)] text-[var(--fx-ink-2)]'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <p className="text-xs text-[var(--fx-ink-2)]">
        Get notified the moment someone messages you about a scanned sticker — even when RapiQR isn't open in a tab.
      </p>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      {enabled ? (
        <button onClick={handleDisable} disabled={busy} className="px-5 py-2.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5">
          {busy && <Loader2 size={13} className="animate-spin" />} Turn Off
        </button>
      ) : (
        <button onClick={handleEnable} disabled={busy} className="px-5 py-2.5 rounded-xl bg-[var(--fx-accent)] hover:bg-[var(--fx-accent-ink)] text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-[var(--fx-accent)]/20 transition-all">
          {busy && <Loader2 size={13} className="animate-spin" />} Turn On
        </button>
      )}
    </div>
  );
}
