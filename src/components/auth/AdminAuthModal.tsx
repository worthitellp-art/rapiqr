import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, ShieldAlert, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const { adminSignIn } = useAuth();

  const [adminEmail, setAdminEmail] = useState<string>(
    () => ((import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.replace(/^["']|["']$/g, '').trim()) || 'worthitellp@gmail.com'
  );
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleAdminEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdminEmail(event.target.value);
  };

  const handleAdminPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdminPassword(event.target.value);
  };

  const handleAdminLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const signInResult = await adminSignIn(adminEmail.trim(), adminPassword.trim());
      if (!signInResult.success) {
        setErrorMessage(signInResult.error || 'Invalid Admin Credentials.');
      } else {
        onSuccess();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[510] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100/80 p-8 space-y-6"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center">
          <div className="w-13 h-13 rounded-2xl bg-[#F5F5F5] border border-[#111111]/40 text-[#111111] flex items-center justify-center mx-auto mb-3.5">
            <ShieldAlert size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Admin Access
          </h2>
        </div>

        {/* Error Feedback Message */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="worthitellp@gmail.com"
                value={adminEmail}
                onChange={handleAdminEmailChange}
                className="w-full pl-10 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/25 transition-all text-slate-900 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={adminPassword}
                onChange={handleAdminPasswordChange}
                className="w-full pl-10 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/25 transition-all text-slate-900 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl font-bold text-[#FFFFFF] text-sm flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#000000] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
