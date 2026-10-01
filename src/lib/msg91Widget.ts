/**
 * Thin wrapper around MSG91's OTP Widget (the script-tag integration from the
 * MSG91 dashboard, not the @msg91comm/sendotp-react-native SDK — this is a
 * web app, not React Native). The widget owns the actual OTP send/verify
 * round-trip with MSG91's servers; all this app does with the result is hand
 * the access token it returns to the backend, which re-verifies it
 * server-side (Server/services/msg91Client.js verifyMsg91WidgetAccessToken)
 * before trusting anything.
 */

interface Msg91WidgetSuccessData {
  message?: string;
  [key: string]: unknown;
}

interface Msg91WidgetError {
  message?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
    sendOtp?: (
      identifier: string,
      onSuccess?: (data: Msg91WidgetSuccessData) => void,
      onFailure?: (error: Msg91WidgetError) => void
    ) => void;
    verifyOtp?: (
      otp: string,
      onSuccess?: (data: Msg91WidgetSuccessData) => void,
      onFailure?: (error: Msg91WidgetError) => void
    ) => void;
    retryOtp?: (
      channel: string | undefined,
      onSuccess?: (data: Msg91WidgetSuccessData) => void,
      onFailure?: (error: Msg91WidgetError) => void
    ) => void;
  }
}

import { API_BASE_URL } from './apiClient';

function sanitizeWidgetId(id: unknown): string {
  const trimmed = String(id || '').trim();
  // Auto-correct common typo where an extra '3' was inserted before '231'
  if (trimmed === '36696e6551613339303333231') {
    return '36696e655161333930333231';
  }
  return trimmed;
}

function extractMsg91ErrorMessage(error: any, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  if (typeof error.error === 'string' && error.error.trim()) return error.error.trim();
  if (typeof error.errors === 'string' && error.errors.trim()) return error.errors.trim();
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    const first = error.errors[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first && typeof first.message === 'string' && first.message.trim()) return first.message.trim();
  }
  return fallback;
}

let cachedWidgetId = sanitizeWidgetId((import.meta.env.VITE_MSG91_WIDGET_ID as string | undefined) || '');
let cachedTokenAuth = (import.meta.env.VITE_MSG91_WIDGET_TOKEN_AUTH as string | undefined)?.trim() || '';

export async function getWidgetConfig(): Promise<{ widgetId: string; tokenAuth: string }> {
  if (cachedWidgetId && cachedTokenAuth) {
    return { widgetId: cachedWidgetId, tokenAuth: cachedTokenAuth };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/msg91-widget-config`);
    if (res.ok) {
      const data = await res.json();
      if (data?.widgetId && data?.tokenAuth) {
        cachedWidgetId = sanitizeWidgetId(data.widgetId);
        cachedTokenAuth = String(data.tokenAuth).trim();
      }
    }
  } catch (err) {
    console.warn('Failed to load MSG91 widget configuration from backend API:', err);
  }

  return { widgetId: cachedWidgetId, tokenAuth: cachedTokenAuth };
}

const SCRIPT_URLS = [
  'https://verify.msg91.com/otp-provider.js',
  'https://verify.phone91.com/otp-provider.js',
];

function loadScript(urls: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let i = 0;
    const attempt = () => {
      const script = document.createElement('script');
      script.src = urls[i];
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        i += 1;
        if (i < urls.length) attempt();
        else reject(new Error('Failed to load the MSG91 OTP widget script.'));
      };
      document.head.appendChild(script);
    };
    attempt();
  });
}

let initPromise: Promise<void> | null = null;

/** Polls until `window.sendOtp` is attached — with exposeMethods, initSendOTP() sets it up asynchronously (builds an internal iframe/session first), so it isn't available the instant initSendOTP() returns. */
function waitForWidgetMethods(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (typeof window.sendOtp === 'function') {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('MSG91 widget did not finish initializing in time.'));
        return;
      }
      setTimeout(check, 150);
    };
    check();
  });
}

/** Loads the widget script (once) and initializes it with exposeMethods so this app can drive it with its own UI instead of MSG91's default popup. */
export async function initMsg91Widget(): Promise<void> {
  if (initPromise) return initPromise;

  const { widgetId, tokenAuth } = await getWidgetConfig();

  if (!widgetId || !tokenAuth) {
    return Promise.reject(
      new Error('MSG91 widget is not configured — set VITE_MSG91_WIDGET_ID and VITE_MSG91_WIDGET_TOKEN_AUTH.')
    );
  }

  initPromise = loadScript(SCRIPT_URLS).then(() => {
    if (typeof window.initSendOTP !== 'function') {
      throw new Error('MSG91 widget script loaded but initSendOTP is unavailable.');
    }
    window.initSendOTP({
      widgetId,
      tokenAuth,
      exposeMethods: true,
      success: () => {},
      failure: () => {},
    });
    return waitForWidgetMethods();
  }).catch((err) => {
    initPromise = null; // let a retry re-run init instead of replaying a stale rejection
    throw err;
  });

  return initPromise;
}

/** Triggers the OTP send for a phone number/email, resolving once MSG91 confirms it went out. */
export async function sendMsg91Otp(identifier: string): Promise<void> {
  await initMsg91Widget();
  return new Promise((resolve, reject) => {
    if (typeof window.sendOtp !== 'function') {
      reject(new Error('OTP widget is not ready yet — please try again in a moment.'));
      return;
    }
    window.sendOtp(
      identifier,
      () => resolve(),
      (error) => {
        // MSG91's widget often calls onFailure with no `.message` (domain not
        // whitelisted, invalid/expired widget credentials, exhausted SMS
        // balance) — log the raw payload so the real reason is visible in
        // devtools instead of just the generic fallback text below.
        console.error('MSG91 sendOtp failure:', error);
        reject(new Error(extractMsg91ErrorMessage(error, 'Failed to send the verification code.')));
      }
    );
  });
}

/** Verifies the code the visitor typed with MSG91 directly, resolving with the access token to send to our backend. */
export async function verifyMsg91Otp(otp: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window.verifyOtp !== 'function') {
      reject(new Error('OTP widget is not ready — request a new code.'));
      return;
    }
    window.verifyOtp(
      otp,
      (data) => {
        const token = data?.message;
        if (!token) {
          reject(new Error('OTP verified but no access token was returned — please retry.'));
          return;
        }
        resolve(token);
      },
      (error) => {
        console.error('MSG91 verifyOtp failure:', error);
        reject(new Error(extractMsg91ErrorMessage(error, 'Incorrect code — please try again.')));
      }
    );
  });
}

/**
 * Resends the OTP, optionally over a different channel. MSG91's widget throws
 * "Channel not provided in retryOtp() method" if this is left undefined, so
 * every caller gets a real channel here even when it doesn't pass one — 'text'
 * (SMS) matches this project's default send channel.
 */
export async function retryMsg91Otp(channel: 'text' | 'voice' | 'whatsapp' = 'text'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.retryOtp !== 'function') {
      reject(new Error('OTP widget is not ready — request a new code.'));
      return;
    }
    window.retryOtp(
      channel,
      () => resolve(),
      (error) => {
        console.error('MSG91 retryOtp failure:', error);
        reject(new Error(extractMsg91ErrorMessage(error, 'Failed to resend the code.')));
      }
    );
  });
}

/** Builds the identifier MSG91 expects for an Indian mobile number: country code + 10 digits, no separators. */
export function toMsg91Identifier(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 ? `91${last10}` : digits;
}
