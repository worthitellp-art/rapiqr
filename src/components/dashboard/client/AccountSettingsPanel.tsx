import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Mail, Smartphone, Loader2, Check, Copy } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { apiClient, isApiBackendConfigured } from '../../../lib/apiClient';
import PhoneInputWithCountry from '../../common/PhoneInputWithCountry';

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-[#F5F6FA] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#111111]';
const labelCls = 'block text-xs font-bold text-[#64748B] mb-1';
const cardCls = 'bg-white border border-[#E8ECF4] rounded-2xl p-5 sm:p-6 space-y-4';

function Banner({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  return (
    <div className={`text-xs font-bold px-3.5 py-2.5 rounded-xl ${tone === 'success' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
      {message}
    </div>
  );
}

export default function AccountSettingsPanel({ showToast, onAccountDeleted }: { showToast: (msg: string) => void; onAccountDeleted?: () => void }) {
  const { profile, refreshProfile } = useAuth();

  if (!isApiBackendConfigured) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">Account Settings</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">Manage your name, phone, email, password and security options.</p>
        </div>
        <div className={cardCls}>
          <p className="text-sm text-[#64748B]">
            Account settings (email/password/2FA changes) require the RapiQR backend to be connected. Configure <code className="text-xs bg-[#F5F6FA] px-1.5 py-0.5 rounded">VITE_API_BASE_URL</code> to enable this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">Account Settings</h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">Manage your name, phone, email, password and security options.</p>
      </div>

      <ProfileForm profile={profile} refreshProfile={refreshProfile} showToast={showToast} />
      <EmailForm profile={profile} refreshProfile={refreshProfile} showToast={showToast} />
      <PasswordForm showToast={showToast} />
      <TwoFactorSection profile={profile} refreshProfile={refreshProfile} showToast={showToast} />
      <DangerZoneSection onAccountDeleted={onAccountDeleted} />
    </div>
  );
}

function DangerZoneSection({ onAccountDeleted }: { onAccountDeleted?: () => void }) {
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const handleDelete = async () => {
    if (!password) {
      setMsg({ tone: 'error', text: 'Enter your password to confirm.' });
      return;
    }
    if (!confirming) {
      setConfirming(true);
      setMsg(null);
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await deleteAccount(password);
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
      <p className="text-xs text-[#64748B]">
        Permanently delete your account, profile, and every sticker linked to it. This cannot be undone.
      </p>
      <div className="max-w-xs">
        <label className={labelCls}>Confirm Your Password</label>
        <input
          type="password"
          className={inputCls}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setConfirming(false); setMsg(null); }}
        />
      </div>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      {confirming && !msg && (
        <p className="text-xs font-bold text-[#B45309]">Click "Confirm Delete" again to permanently delete your account.</p>
      )}
      <button
        onClick={handleDelete}
        disabled={busy}
        className="px-5 py-2.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
      >
        {busy && <Loader2 size={13} className="animate-spin" />} {confirming ? 'Confirm Delete' : 'Delete Account'}
      </button>
    </div>
  );
}

function ProfileForm({ profile, refreshProfile, showToast }: any) {
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.auth.updateProfile({ fullName, phoneNumber });
      await refreshProfile();
      setMsg({ tone: 'success', text: 'Profile updated.' });
      showToast('Profile updated successfully');
    } catch (err: any) {
      setMsg({ tone: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cardCls}>
      <h3 className="font-bold text-sm text-[#1A1D26] flex items-center gap-2"><Smartphone size={15} /> Profile</h3>
      <div className="grid sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelCls}>Full Name</label>
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <PhoneInputWithCountry
            value={phoneNumber}
            onChange={(full) => setPhoneNumber(full)}
            placeholder="10-digit mobile"
          />
        </div>
      </div>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
      >
        {saving && <Loader2 size={13} className="animate-spin" />} Save Profile
      </button>
    </div>
  );
}

function EmailForm({ profile, refreshProfile, showToast }: any) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    if (!newEmail.includes('@') || !currentPassword) {
      setMsg({ tone: 'error', text: 'Enter a valid new email and your current password.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiClient.auth.changeEmail(newEmail, currentPassword);
      if (res.token) localStorage.setItem('namoqr-token', res.token);
      await refreshProfile();
      setMsg({ tone: 'success', text: 'Email updated.' });
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
      <h3 className="font-bold text-sm text-[#1A1D26] flex items-center gap-2"><Mail size={15} /> Email Address</h3>
      <p className="text-xs text-[#64748B]">Current: <span className="font-semibold text-[#1A1D26]">{profile?.email}</span></p>
      <div className="grid sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelCls}>New Email</label>
          <input className={inputCls} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" />
        </div>
        <div>
          <label className={labelCls}>Current Password</label>
          <input type="password" className={inputCls} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
      </div>
      {msg && <Banner tone={msg.tone} message={msg.text} />}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
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
      <h3 className="font-bold text-sm text-[#1A1D26] flex items-center gap-2"><KeyRound size={15} /> Change Password</h3>
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
        className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
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
        <h3 className="font-bold text-sm text-[#1A1D26] flex items-center gap-2"><ShieldCheck size={15} /> Two-Factor Authentication (2FA)</h3>
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${enabled ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {!enabled && !setupData && (
        <>
          <p className="text-xs text-[#64748B]">Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc).</p>
          <button onClick={startSetup} disabled={busy} className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center gap-1.5">
            {busy && <Loader2 size={13} className="animate-spin" />} Set Up 2FA
          </button>
        </>
      )}

      {!enabled && setupData && (
        <div className="space-y-3">
          <p className="text-xs text-[#64748B]">Scan-free setup: open your authenticator app, choose "Enter a setup key manually", and enter this key:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono font-bold bg-[#F5F6FA] border border-[#E8ECF4] rounded-xl px-3.5 py-2.5 break-all">{setupData.secret}</code>
            <button onClick={copySecret} className="w-10 h-10 flex-shrink-0 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] flex items-center justify-center cursor-pointer">
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
            <button onClick={verifyCode} disabled={busy || code.length !== 6} className="flex-1 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5">
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
