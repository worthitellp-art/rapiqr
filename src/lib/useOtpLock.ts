import { useCallback, useEffect, useState } from 'react';
import { checkOtpRateLimit } from './otpRateLimit';

/**
 * Live view of a phone number's OTP locks (see otpRateLimit.ts): `sendLockMs`
 * blocks requesting more codes, `verifyLockMs` blocks verifying (and sending).
 * Both tick down once a second and re-read storage when they reach zero.
 * Call `refresh()` right after recording an attempt to pick up a new lock.
 */
export function useOtpLock(phone: string) {
  const [sendLockMs, setSendLockMs] = useState(0);
  const [verifyLockMs, setVerifyLockMs] = useState(0);

  const refresh = useCallback(() => {
    if (!phone || phone.replace(/\D/g, '').length < 7) {
      setSendLockMs(0);
      setVerifyLockMs(0);
      return;
    }
    setSendLockMs(checkOtpRateLimit(phone, 'send').remainingMs);
    setVerifyLockMs(checkOtpRateLimit(phone, 'verify').remainingMs);
  }, [phone]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ticking = sendLockMs > 0 || verifyLockMs > 0;
  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => {
      setSendLockMs((ms) => Math.max(0, ms - 1000));
      setVerifyLockMs((ms) => Math.max(0, ms - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [ticking]);

  // A lock hitting zero may unlock the matching counter in storage — resync.
  useEffect(() => {
    if (!ticking) refresh();
  }, [ticking, refresh]);

  return { sendLockMs, verifyLockMs, refresh };
}
