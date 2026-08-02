import { useEffect, useState } from 'react';
import { supabase, getAuthCallbackUrl } from '../lib/supabase';

type CallbackStatus = 'processing' | 'success' | 'error';

interface AuthCallbackProps {
  onSuccess?: () => void;
}

export default function AuthCallback({ onSuccess }: AuthCallbackProps) {
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const executeAuthenticationCallback = async () => {
      try {
        const searchParameters = new URLSearchParams(window.location.search);
        const oauthErrorDescription = searchParameters.get('error_description') || searchParameters.get('error');

        if (oauthErrorDescription) {
          if (!isCancelled) {
            setErrorMessage(oauthErrorDescription);
            setStatus('error');
          }
          return;
        }

        // 1. Check if session already exists
        const { data: initialSessionData } = await supabase.auth.getSession();
        if (initialSessionData?.session) {
          completeAuthentication();
          return;
        }

        // 2. Listen for auth state change
        const { data: authStateListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            authStateListener.subscription.unsubscribe();
            completeAuthentication();
          }
        });

        // 3. Exchange PKCE code if present in URL
        const authCode = searchParameters.get('code');
        if (authCode) {
          const { data: codeExchangeData, error: codeExchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (!codeExchangeError && codeExchangeData?.session) {
            authStateListener.subscription.unsubscribe();
            completeAuthentication();
            return;
          }

          // If code was already exchanged by internal listener, re-check session
          const { data: retrySessionData } = await supabase.auth.getSession();
          if (retrySessionData?.session) {
            authStateListener.subscription.unsubscribe();
            completeAuthentication();
            return;
          }
        }

        // 4. Fallback delay check
        setTimeout(async () => {
          if (isCancelled) return;
          const { data: finalSessionData } = await supabase.auth.getSession();
          authStateListener.subscription.unsubscribe();
          if (finalSessionData?.session) {
            completeAuthentication();
          } else {
            setErrorMessage('Authentication session could not be established.');
            setStatus('error');
          }
        }, 1200);

      } catch (err: any) {
        if (!isCancelled) {
          console.warn('OAuth Callback Error:', err);
          completeAuthentication();
        }
      }
    };

    function completeAuthentication() {
      if (isCancelled) return;
      setStatus('success');
      
      const targetUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin + '/' : '/';
      window.history.replaceState({}, document.title, targetUrl);
      
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = getAuthCallbackUrl('/');
      }
    }

    executeAuthenticationCallback();

    return () => {
      isCancelled = true;
    };
  }, [onSuccess]);

  const handleRedirectHome = () => {
    window.location.href = getAuthCallbackUrl('/');
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-[3px] border-[#FF6500]/20 rounded-full" />
            <div
              className="absolute inset-0 border-[3px] border-transparent border-t-[#FF6500] rounded-full animate-spin"
              style={{ animationDuration: '0.7s' }}
            />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-800">Completing sign-in</p>
            <p className="text-sm text-gray-400 mt-1">Redirecting to your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center border border-gray-100">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Sign-in Failed</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {errorMessage || 'We couldn\'t complete the Google sign-in. Please try again.'}
          </p>
          <button
            onClick={handleRedirectHome}
            className="w-full py-3 rounded-xl bg-[#FF6500] hover:bg-[#E55A00] text-white font-bold text-sm transition-colors shadow-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

