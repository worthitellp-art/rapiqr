import { useEffect } from 'react';

interface AuthCallbackProps {
  onSuccess?: () => void;
}

/**
 * Historically the landing page for a Supabase OAuth redirect
 * (`supabase.auth.signInWithOAuth`). Google sign-in now completes entirely
 * within the Google Identity Services popup in AuthContext.signInWithGoogle
 * and never redirects the page, so nothing navigates here anymore under
 * normal use — this just sends a stray visit back home.
 */
export default function AuthCallback({ onSuccess }: AuthCallbackProps) {
  useEffect(() => {
    try {
      localStorage.setItem('repiqr-current-page', 'dashboard');
      localStorage.setItem('namoqr-current-page', 'dashboard');
    } catch {
      // Ignore storage errors
    }

    const targetUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin + '/' : '/';
    window.history.replaceState({}, document.title, targetUrl);

    if (onSuccess) {
      onSuccess();
    } else if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  }, [onSuccess]);

  return null;
}
