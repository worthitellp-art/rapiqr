import { useEffect, useState } from 'react';
import { supabase, getAuthCallbackUrl } from '../lib/supabase';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function AuthCallback({ onSuccess }: { onSuccess?: () => void }) {
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        // 1) Check existing session first
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          finish();
          return;
        }

        // 2) Listen for auth state change
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            authListener.subscription.unsubscribe();
            finish();
          }
        });

        // 3) Try explicit PKCE code exchange if ?code= parameter is in URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeErr && exchangeData?.session) {
            authListener.subscription.unsubscribe();
            finish();
            return;
          }
        }

        // 4) Check again after short delay
        setTimeout(async () => {
          if (cancelled) return;
          const retry = await supabase.auth.getSession();
          authListener.subscription.unsubscribe();
          finish();
        }, 1200);

      } catch (err: any) {
        if (!cancelled) {
          console.warn('OAuth Callback Error:', err);
          finish();
        }
      }
    };

    function finish() {
      if (cancelled) return;
      setStatus('success');
      // Clean up URL pathname away from /auth/callback to root '/' so App router advances
      window.history.replaceState({}, document.title, '/');
      if (onSuccess) {
        onSuccess();
      } else {
        // Land on the real dashboard: local origin when running locally, otherwise
        // the configured hosting URL (never a stray localhost/preview origin).
        window.location.href = getAuthCallbackUrl('/');
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Full-page loader ──────────────────────────────────────────────
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Animated circles */}
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

  // ─── Error state ───────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center border border-gray-100">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Sign-in Failed</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {error || 'We couldn\'t complete the Google sign-in. Please try again.'}
          </p>
          <button
            onClick={() => {
              window.location.href = getAuthCallbackUrl('/');
            }}
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
