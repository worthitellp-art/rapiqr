import React from 'react';
import { X, Shield } from 'lucide-react';
import AppLogo from '../common/AppLogo';
import AuthAlertMessage from './AuthAlertMessage';
import AuthMethodList from './AuthMethodList';
import EmailAuthStep from './EmailAuthStep';
import PhoneAuthStep from './PhoneAuthStep';
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
    phone,
    password,
    fullName,
    isPasswordVisible,
    isSubmitting,
    errorMessage,
    successMessage,
    setEmail,
    setPhone,
    setPassword,
    setFullName,
    setIsPasswordVisible,
    switchAuthMode,
    selectAuthStep,
    handleEmailSubmit,
    handlePhoneSubmit,
    handlePasswordResetSubmit,
    handleGoogleAuthentication,
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
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      onClick={onClose}
    >
      {/* ── Ultra-Clean Minimal Card Container ── */}
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden relative p-7 sm:p-8 space-y-6 animate-modal-pop"
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
            className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-amber-400/20 blur-3xl"
            aria-hidden="true"
          />
          <AppLogo variant="light" className="relative h-9 w-auto mx-auto object-contain mb-3" />
          <h2 className="relative text-2xl font-extrabold text-slate-900 tracking-tight">
            {authMode === 'login' ? 'Welcome back' : 'Get started with RapiQR'}
          </h2>
          <p className="relative text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            {authStep === 'list' && 'Select your preferred sign-in option below'}
            {authStep === 'email' && 'Enter your email details to proceed'}
            {authStep === 'phone' && 'Enter your mobile phone details to proceed'}
            {authStep === 'forgot' && 'Enter your email address to reset your password'}
          </p>
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

        {/* Step 2B: Phone Input Screen */}
        {authStep === 'phone' && (
          <PhoneAuthStep
            currentMode={authMode}
            phone={phone}
            fullName={fullName}
            password={password}
            isPasswordVisible={isPasswordVisible}
            isSubmitting={isSubmitting}
            onPhoneChange={setPhone}
            onFullNameChange={setFullName}
            onPasswordChange={setPassword}
            onTogglePasswordVisibility={handleTogglePasswordVisibility}
            onBackToList={handleReturnToListStep}
            onSubmit={handlePhoneSubmit}
          />
        )}

        {/* Step 2C: Password Reset Screen */}
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
