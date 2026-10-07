import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle2, Loader2 } from 'lucide-react';
import { getExistingSubscription, isPushSupported, subscribeToPush } from '../../lib/push';

type PushState = 'checking' | 'unsupported' | 'blocked' | 'on' | 'off';

/**
 * Turns browser notifications on for this device. Nothing here asks for permission
 * on its own: the browser prompt only ever appears from the "Turn on" click. Once
 * on, the status stays on; it doesn't flip back unless the browser setting changes.
 */
export default function NotificationToggle({
  compact = false,
  tone = 'light',
  onEnabled,
}: {
  /** Icon-and-label button for a toolbar; the full status line otherwise. */
  compact?: boolean;
  tone?: 'light' | 'dark';
  onEnabled?: () => void;
}) {
  const [state, setState] = useState<PushState>('checking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isPushSupported() || !('Notification' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('blocked');
      return;
    }
    const sub = await getExistingSubscription().catch(() => null);
    setState(Notification.permission === 'granted' && sub ? 'on' : 'off');
  }, []);

  // Re-check when the tab regains focus, e.g. after changing the setting in the browser.
  useEffect(() => {
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh]);

  if (state === 'checking' || state === 'unsupported') return null;

  const dark = tone === 'dark';
  const muted = dark ? 'text-white/55' : 'text-[var(--fx-ink-2)]';
  const strong = dark ? 'text-white' : 'text-[var(--fx-ink)]';

  if (state === 'on') {
    if (compact) return null;
    return (
      <p className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
        <CheckCircle2 size={14} /> Notifications are on
      </p>
    );
  }

  if (state === 'blocked') {
    return (
      <p
        className={`flex items-start gap-1.5 px-2 py-1.5 text-[11px] leading-snug ${muted}`}
        title="Allow notifications for this site in the browser's site settings"
      >
        <BellOff size={13} className="mt-0.5 shrink-0" />
        <span>Notifications are blocked. Allow them in this site's browser settings.</span>
      </p>
    );
  }

  const turnOn = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await subscribeToPush();
      if (res.success) {
        setState('on');
        onEnabled?.();
      } else {
        setError(res.error || "Couldn't turn on notifications.");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const button = compact ? (
    <button
      type="button"
      onClick={turnOn}
      disabled={busy}
      title="Turn on notifications"
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--fx-radius-control)] text-xs font-bold cursor-pointer transition-colors disabled:opacity-60 ${
        dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-hover)]'
      }`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
      <span>Turn on notifications</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={turnOn}
      disabled={busy}
      className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-[var(--fx-radius-control)] text-xs font-bold cursor-pointer transition-colors disabled:opacity-60 ${
        dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-hover)]'
      }`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
      <span>{busy ? 'Waiting for your browser…' : 'Turn on notifications'}</span>
    </button>
  );

  return (
    <div className={compact ? '' : `space-y-2 px-2 py-1.5 ${strong}`}>
      {!compact && <p className={`text-[11px] leading-snug ${muted}`}>Get an alert on this device for scans, SOS and new requests.</p>}
      {button}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
