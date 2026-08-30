import { apiClient } from './apiClient';

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

/** Web Push requires the VAPID key as a raw Uint8Array, not the base64url string it's issued as. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** The current subscription for this browser, if any (regardless of whether the backend still has it on file). */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/**
 * Requests notification permission (if not already granted/denied) and
 * registers this browser for push, then saves the subscription server-side
 * against the logged-in owner's account.
 */
export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) return { success: false, error: 'Push notifications are not supported in this browser.' };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was not granted.' };
    }

    const keyRes = await apiClient.push.getVapidPublicKey();
    if (!keyRes?.publicKey) {
      return { success: false, error: 'Push notifications are not configured on the server.' };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.publicKey),
      });
    }

    await apiClient.push.subscribe(subscription.toJSON());
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to enable notifications.' };
  }
}

/** Unregisters this browser both locally and on the backend. */
export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await getExistingSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await apiClient.push.unsubscribe(endpoint).catch(() => { /* best effort */ });
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to disable notifications.' };
  }
}
