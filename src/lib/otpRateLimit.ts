/**
 * OTP Rate Limiting Utility
 *
 * Per phone number: 3 code sends and 3 failed verifications are allowed, then
 * the relevant action is locked for 4 hours.
 *  - Send lock   — hit after the 3rd code is sent. The 3rd code is still valid
 *                  and can be verified; only requesting MORE codes is blocked.
 *  - Verify lock — hit after the 3rd wrong code. Blocks verifying AND sending,
 *                  since a fresh code would just hand the attacker new guesses.
 * Persists in localStorage across page refreshes and browser sessions. The
 * MSG91 widget sends/resends straight from the browser (bypassing our server),
 * so this is the per-number guard for those calls; the server's per-IP limiter
 * still covers the pre-flight request.
 */

export const MAX_OTP_ATTEMPTS = 3;
export const OTP_LOCKOUT_MS = 4 * 60 * 60 * 1000; // 4 hours

export type OtpAction = 'send' | 'verify';

export interface OtpRateLimitState {
  sendAttempts: number;
  verifyAttempts: number;
  sendLockedUntil: number; // Unix ms — blocks sending more codes
  lockedUntil: number; // Unix ms — verify lock, blocks everything
}

const EMPTY_STATE: OtpRateLimitState = { sendAttempts: 0, verifyAttempts: 0, sendLockedUntil: 0, lockedUntil: 0 };

function cleanPhoneIdentifier(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 ? last10 : digits || 'general';
}

function getStorageKey(phone: string): string {
  return `rapiqr_otp_limit_${cleanPhoneIdentifier(phone)}`;
}

export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '0 minutes';
  const totalMinutes = Math.max(1, Math.ceil(ms / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min` : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

function saveState(phone: string, state: OtpRateLimitState): void {
  try {
    const empty = !state.sendAttempts && !state.verifyAttempts && !state.sendLockedUntil && !state.lockedUntil;
    if (empty) localStorage.removeItem(getStorageKey(phone));
    else localStorage.setItem(getStorageKey(phone), JSON.stringify(state));
  } catch {
    /* ignore storage errors */
  }
}

/** Reads the stored state, resetting whichever counter's lock has expired. */
export function getOtpRateLimitState(phone: string): OtpRateLimitState {
  let state: OtpRateLimitState = { ...EMPTY_STATE };
  try {
    const raw = localStorage.getItem(getStorageKey(phone));
    if (raw) state = { ...EMPTY_STATE, ...JSON.parse(raw) };
  } catch {
    /* ignore parse errors */
  }

  const now = Date.now();
  let changed = false;
  if (state.sendLockedUntil && now >= state.sendLockedUntil) {
    state = { ...state, sendAttempts: 0, sendLockedUntil: 0 };
    changed = true;
  }
  if (state.lockedUntil && now >= state.lockedUntil) {
    state = { ...state, verifyAttempts: 0, lockedUntil: 0 };
    changed = true;
  }
  if (changed) saveState(phone, state);
  return state;
}

export function clearOtpRateLimit(phone: string): void {
  try {
    localStorage.removeItem(getStorageKey(phone));
  } catch {
    /* ignore */
  }
}

/** How long `action` is blocked for, in ms (0 = allowed). */
function lockRemaining(state: OtpRateLimitState, action: OtpAction): number {
  const now = Date.now();
  const until = action === 'verify' ? state.lockedUntil : Math.max(state.lockedUntil, state.sendLockedUntil);
  return until > now ? until - now : 0;
}

export function checkOtpRateLimit(
  phone: string,
  action: OtpAction = 'send'
): {
  isLocked: boolean;
  remainingMs: number;
  sendAttempts: number;
  verifyAttempts: number;
  remainingTimeStr: string;
} {
  const state = getOtpRateLimitState(phone);
  const remainingMs = lockRemaining(state, action);
  return {
    isLocked: remainingMs > 0,
    remainingMs,
    sendAttempts: state.sendAttempts,
    verifyAttempts: state.verifyAttempts,
    remainingTimeStr: remainingMs > 0 ? formatRemainingTime(remainingMs) : '',
  };
}

export interface OtpAttemptResult {
  /** True when this attempt used up the allowance and the action is now locked. */
  isLocked: boolean;
  remainingMs: number;
  attempts: number;
  remainingTimeStr: string;
}

/**
 * Records a code send/resend. Call it only after the send succeeded. When this
 * is the 3rd send, `isLocked` is true: the code just sent is still usable, but
 * no further codes can be requested for 4 hours.
 */
export function recordOtpSendAttempt(phone: string): OtpAttemptResult {
  const state = getOtpRateLimitState(phone);
  const attempts = state.sendAttempts + 1;
  const locked = attempts >= MAX_OTP_ATTEMPTS;
  saveState(phone, {
    ...state,
    sendAttempts: attempts,
    sendLockedUntil: locked ? Date.now() + OTP_LOCKOUT_MS : state.sendLockedUntil,
  });
  return {
    isLocked: locked,
    remainingMs: locked ? OTP_LOCKOUT_MS : 0,
    attempts,
    remainingTimeStr: locked ? formatRemainingTime(OTP_LOCKOUT_MS) : '',
  };
}

/** Records a failed verification. The 3rd failure locks verifying and sending for 4 hours. */
export function recordOtpVerifyFailure(phone: string): OtpAttemptResult {
  const state = getOtpRateLimitState(phone);
  const attempts = state.verifyAttempts + 1;
  const locked = attempts >= MAX_OTP_ATTEMPTS;
  saveState(phone, {
    ...state,
    verifyAttempts: attempts,
    lockedUntil: locked ? Date.now() + OTP_LOCKOUT_MS : state.lockedUntil,
  });
  return {
    isLocked: locked,
    remainingMs: locked ? OTP_LOCKOUT_MS : 0,
    attempts,
    remainingTimeStr: locked ? formatRemainingTime(OTP_LOCKOUT_MS) : '',
  };
}
