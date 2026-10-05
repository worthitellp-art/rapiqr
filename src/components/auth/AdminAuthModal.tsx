import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, ShieldAlert, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { authTranslations } from '../../i18n/authTranslations';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * The ONLY entry point into the admin dashboard (secret /admin route). The server
 * accepts only the admin email and its password (bcrypt hash in Server/.env), so
 * this modal just forwards what was typed.
 */
export default function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const { adminLogin } = useAuth();
  const { language } = useLanguage();
  const t = authTranslations[language].admin;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(t.errors.missingFields);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adminLogin(email, password);
      if (!result.success) {
        setErrorMessage(result.error || t.errors.incorrectCredentials);
        return;
      }
      setPassword('');
      onSuccess();
      onClose();
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
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label={t.closeModalAriaLabel}
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="w-13 h-13 rounded-2xl bg-[#F5F5F5] border border-[#111111]/40 text-[#111111] flex items-center justify-center mx-auto mb-3.5">
            <ShieldAlert size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t.title}</h2>
          <p className="mt-1.5 text-xs text-slate-500">{t.subtitle}</p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-900 mb-1.5">
              {t.emailLabel}
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              autoFocus
              className="w-full h-11 px-3.5 rounded-lg border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-900 mb-1.5">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-gray-300 bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md text-gray-500 hover:text-black flex items-center justify-center cursor-pointer"
                aria-label={showPassword ? t.hidePasswordAriaLabel : t.showPasswordAriaLabel}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !password}
            className="w-full h-11 rounded-lg font-semibold text-black text-sm flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 hover:border-black active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <>
                <span>{t.signIn}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
