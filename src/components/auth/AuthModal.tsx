import React from 'react';
import { X, Shield } from 'lucide-react';
import AppLogo from '../common/AppLogo';
import AuthAlertMessage from './AuthAlertMessage';
import AuthMethodList from './AuthMethodList';
import EmailAuthStep from './EmailAuthStep';
import EmailOtpStep from './EmailOtpStep';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useAuthForm } from './hooks/useAuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'signup';
  prefillEmail?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  prefillEmail = '',
}: AuthModalProps) {
  const {
    authMode,
    authStep,
    email,
    password,
    fullName,
    isPasswordVisible,
    isSubmitting,
    errorMessage,
    successMessage,
    otpCode,
    otpSent,
    setEmail,
    setPassword,
    setFullName,
    setIsPasswordVisible,
    setOtpCode,
    switchAuthMode,
    selectAuthStep,
    handleEmailSubmit,
    handlePasswordResetSubmit,
    handleGoogleAuthentication,
    handleSendEmailOtp,
    handleVerifyEmailOtp,
  } = useAuthForm({
    isOpen,
    initialMode,
    prefillEmail,
    onClose,
    onSuccess,
  });

  if (!isOpen) {
    return null;
  }

  const handleTogglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleReturnToListStep = () => {
    selectAuthStep('list');
  };

  const handleSwitchToForgotStep = () => {
    selectAuthStep('forgot');
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in font-body"
      style={{ fontFamily: "'Pinterest Sans', 'Pin Sans', sans-serif" }}
      onClick={onClose}
    >
      {/* ── Modal Card — 32px radius, matching the app's other large surfaces ── */}
      <div
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden relative p-7 sm:p-8 space-y-6 animate-modal-pop"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer z-10"
          aria-label="Close authentication modal"
        >
          <X size={18} />
        </button>

        {/* Modal Top Brand Header */}
        <div className="text-center pt-2 relative">
          {/* Soft brand glow behind the logo — pure CSS, no extra asset */}
          <div
            className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-[#111111]/20 blur-3xl"
            aria-hidden="true"
          />
          <AppLogo variant="light" className="relative h-9 w-auto mx-auto object-contain mb-3" />
          <h2 className="relative text-2xl font-extrabold text-slate-900 tracking-tight">
            {authMode === 'login' ? 'Welcome back' : 'Get started with RapiQR'}
          </h2>
          {authStep === 'forgot' && (
            <p className="relative text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              Enter your email to reset your password
            </p>
          )}
        </div>

        {/* Feedback Alert Banners */}
        <AuthAlertMessage errorMessage={errorMessage} successMessage={successMessage} />

        {/* Step 1: Clean Minimal Option List */}
        {authStep === 'list' && (
          <AuthMethodList
            currentMode={authMode}
            isSubmitting={isSubmitting}
            onSelectMode={switchAuthMode}
            onSelectStep={selectAuthStep}
            onGoogleSignIn={handleGoogleAuthentication}
          />
        )}

        {/* Step 2A: Email Input Screen */}
        {authStep === 'email' && (
          <EmailAuthStep
            currentMode={authMode}
            email={email}
            fullName={fullName}
            password={password}
            isPasswordVisible={isPasswordVisible}
            isSubmitting={isSubmitting}
            onEmailChange={setEmail}
            onFullNameChange={setFullName}
            onPasswordChange={setPassword}
            onTogglePasswordVisibility={handleTogglePasswordVisibility}
            onForgotPasswordClick={handleSwitchToForgotStep}
            onBackToList={handleReturnToListStep}
            onSubmit={handleEmailSubmit}
          />
        )}

        {/* Step 2C: Passwordless Email OTP Screen */}
        {authStep === 'otp' && (
          <EmailOtpStep
            email={email}
            otpCode={otpCode}
            otpSent={otpSent}
            isSubmitting={isSubmitting}
            onEmailChange={setEmail}
            onOtpCodeChange={setOtpCode}
            onBackToList={handleReturnToListStep}
            onSendCode={handleSendEmailOtp}
            onVerifyCode={handleVerifyEmailOtp}
          />
        )}

        {/* Step 2B: Password Reset Screen */}
        {authStep === 'forgot' && (
          <ForgotPasswordForm
            identifier={email}
            isSubmitting={isSubmitting}
            onIdentifierChange={setEmail}
            onBackToLogin={handleReturnToListStep}
            onSubmit={handlePasswordResetSubmit}
          />
        )}

        {/* Security Footer Badge */}
        <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
          <Shield size={14} className="text-slate-400" />
          <span>Encrypted &amp; Secured by RapiQR Relay</span>
        </div>
      </div>
    </div>
  );
}
