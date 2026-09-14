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

const WIDGET_ID = (import.meta.env.VITE_MSG91_WIDGET_ID as string | undefined)?.trim() || '';
const TOKEN_AUTH = (import.meta.env.VITE_MSG91_WIDGET_TOKEN_AUTH as string | undefined)?.trim() || '';

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
export function initMsg91Widget(): Promise<void> {
  if (initPromise) return initPromise;

  if (!WIDGET_ID || !TOKEN_AUTH) {
    return Promise.reject(
      new Error('MSG91 widget is not configured — set VITE_MSG91_WIDGET_ID and VITE_MSG91_WIDGET_TOKEN_AUTH.')
    );
  }

  initPromise = loadScript(SCRIPT_URLS).then(() => {
    if (typeof window.initSendOTP !== 'function') {
      throw new Error('MSG91 widget script loaded but initSendOTP is unavailable.');
    }
    window.initSendOTP({
      widgetId: WIDGET_ID,
      tokenAuth: TOKEN_AUTH,
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
      (error) => reject(new Error(error?.message || 'Failed to send the verification code.'))
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
      (error) => reject(new Error(error?.message || 'Incorrect code — please try again.'))
    );
  });
}

/** Resends the OTP, optionally over a different channel ('text' | 'voice' | 'whatsapp'). */
export async function retryMsg91Otp(channel?: 'text' | 'voice' | 'whatsapp'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.retryOtp !== 'function') {
      reject(new Error('OTP widget is not ready — request a new code.'));
      return;
    }
    window.retryOtp(
      channel,
      () => resolve(),
      (error) => reject(new Error(error?.message || 'Failed to resend the code.'))
    );
  });
}

/** Builds the identifier MSG91 expects for an Indian mobile number: country code + 10 digits, no separators. */
export function toMsg91Identifier(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 ? `91${last10}` : digits;
}
