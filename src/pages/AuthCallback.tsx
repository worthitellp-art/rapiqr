import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function AuthCallback() {
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
      // 1) Attempt to get the session — with detectSessionInUrl:true,
      //    the Supabase client auto-detects the PKCE code / access_token
      //    from the URL during initialization on page load.
      const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (data?.session) {
          onSuccess();
          return;
        }

        // 2) No session yet — try explicit PKCE code exchange.
        //    Supabase v2+ attaches the code in the URL after the OAuth flow.
        const currentUrl = window.location.href;
        const hasCode = currentUrl.includes('code=') || currentUrl.includes('access_token=');

        if (hasCode) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(currentUrl);
          if (exchangeErr) throw exchangeErr;

          // Re-check session after exchange
          const retry = await supabase.auth.getSession();
          if (retry.data?.session) {
            onSuccess();
            return;
          }
        }

        // 3) Still nothing — the callback URL may have been consumed already
        //    or the OAuth flow didn't complete. Redirect to home; the main
        //    AuthProvider will pick up any persisted session.
        if (!cancelled) {
          setStatus('success');
          cleanUrlAndRedirect();
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setError(err.message || 'Authentication failed. Please try again.');
        }
      }
    };

    function onSuccess() {
      if (cancelled) return;
      setStatus('success');
      cleanUrlAndRedirect();
    }

    function cleanUrlAndRedirect() {
      // Remove OAuth params from the URL so the main app doesn't re-parse them
      window.history.replaceState({}, document.title, window.location.origin);

      // Navigate to root — AuthProvider will pick up the session from
      // localStorage (persisted by the code exchange) and App.tsx will
      // auto-redirect to the dashboard.
      window.location.href = window.location.origin;
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
              window.location.href = window.location.origin;
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
