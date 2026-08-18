import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase, isSupabaseConfigured, getAuthCallbackUrl } from '../../../lib/supabase';

export type AuthMode = 'login' | 'signup';
export type AuthStep = 'list' | 'email' | 'phone' | 'forgot';

interface UseAuthFormOptions {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  prefillEmail?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function useAuthForm({
  isOpen,
  initialMode,
  prefillEmail = '',
  onClose,
  onSuccess,
}: UseAuthFormOptions) {
  const { signIn, signUp, resetPassword, demoLogin } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [authStep, setAuthStep] = useState<AuthStep>('list');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (prefillEmail) {
        setEmail(prefillEmail);
        setAuthMode('signup');
        setAuthStep('email');
      } else {
        setAuthStep('list');
      }
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, prefillEmail]);

  const clearFeedbackMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const switchAuthMode = (newMode: AuthMode) => {
    setAuthMode(newMode);
    clearFeedbackMessages();
  };

  const selectAuthStep = (step: AuthStep) => {
    setAuthStep(step);
    clearFeedbackMessages();
  };

  const handleAuthenticationSuccess = (message: string) => {
    setSuccessMessage(message);
    const REDIRECT_DELAY_MS = 500;

    setTimeout(() => {
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    }, REDIRECT_DELAY_MS);
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedbackMessages();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const signInResponse = await signIn(trimmedEmail, password);
        if (!signInResponse.success) {
          setErrorMessage(signInResponse.error || 'Failed to sign in with email.');
        } else {
          handleAuthenticationSuccess('Signed in successfully!');
        }
      } else {
        const trimmedFullName = fullName.trim();
        if (!trimmedFullName) {
          setErrorMessage('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }

        const signUpResponse = await signUp(
          trimmedEmail,
          password,
          trimmedFullName,
          phone.trim() || undefined
        );

        if (!signUpResponse.success) {
          setErrorMessage(signUpResponse.error || 'Failed to create account.');
        } else {
          handleAuthenticationSuccess('Account created successfully!');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedbackMessages();

    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const signInResponse = await signIn(trimmedPhone, password);
        if (!signInResponse.success) {
          setErrorMessage(signInResponse.error || 'Failed to sign in with phone.');
        } else {
          handleAuthenticationSuccess('Signed in successfully!');
        }
      } else {
        const trimmedFullName = fullName.trim();
        const trimmedEmail = email.trim() || `${trimmedPhone.replace(/\D/g, '')}@rapiqr.user`;

        if (!trimmedFullName) {
          setErrorMessage('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }

        const signUpResponse = await signUp(
          trimmedEmail,
          password,
          trimmedFullName,
          trimmedPhone
        );

        if (!signUpResponse.success) {
          setErrorMessage(signUpResponse.error || 'Failed to create account.');
        } else {
          handleAuthenticationSuccess('Account created successfully!');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedbackMessages();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resetResponse = await resetPassword(trimmedEmail);
      if (!resetResponse.success) {
        setErrorMessage(resetResponse.error || 'Failed to send reset link.');
      } else {
        setSuccessMessage(resetResponse.message || 'Password reset link sent to your email.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuthentication = async () => {
    if (isSupabaseConfigured) {
      try {
        localStorage.setItem('repiqr-current-page', 'dashboard');
        localStorage.setItem('namoqr-current-page', 'dashboard');
      } catch {
        // Safe fallback if local storage access is restricted
      }

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl('/auth/callback'),
        },
      });
      return;
    }

    demoLogin();
    handleAuthenticationSuccess('Logged in as Demo User');
  };

  return {
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
  };
}
