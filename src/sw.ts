/// <reference lib="webworker" />
// Excluded from the app's tsconfig (see tsconfig.json) — the webworker lib
// conflicts with the DOM lib the rest of the app compiles against, and this
// file is bundled by vite-plugin-pwa directly, not type-checked by `tsc`.
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Take over immediately on update rather than waiting for every open tab to
// close — registerType: 'autoUpdate' on the client side already reloads to
// match, so there is no stale-UI window this would otherwise cause.
self.skipWaiting();
self.addEventListener('activate', () => {
  self.clients.claim();
});

/**
 * Web Push — lets a chat reply or emergency alert reach the device even with
 * every tab closed. The payload is a small JSON object sent by the backend
 * (Server/services/pushService.js): { title, body, url, tag }.
 */
self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'RapiQR';
  const options: NotificationOptions = {
    body: data.body || 'You have a new notification.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'rapiqr-notification',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/** Focus an already-open tab and navigate it, or open a fresh one. */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) (client as WindowClient).navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
