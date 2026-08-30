// Captured at module load (not inside a component) — Chromium fires
// beforeinstallprompt as soon as it decides the page is installable, which
// can happen before any component that wants to react to it has mounted.
// Missing that first firing means losing the only chance to call .prompt()
// later, since the event is not re-dispatched.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let promptAvailable = false;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    promptAvailable = true;
    listeners.forEach((cb) => cb());
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    promptAvailable = false;
  });
}

/** True once already running as an installed app (standalone window, no browser chrome). */
export function isRunningInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as any).standalone === true; // iOS Safari's own flag
  return Boolean(standaloneMedia || iosStandalone);
}

/** iOS never fires beforeinstallprompt — "Add to Home Screen" is the only path, done manually via the share sheet. */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isInstallPromptAvailable(): boolean {
  return promptAvailable;
}

/** Fires once immediately if the prompt is already captured, and again whenever it becomes available. */
export function onInstallPromptChange(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Shows the native install dialog. Only works from a real user gesture (a
 * click handler) and only once per captured prompt — the browser discards it
 * after use whether accepted or dismissed.
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  promptAvailable = false;
  return outcome;
}
