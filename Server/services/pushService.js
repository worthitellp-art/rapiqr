const webpush = require('web-push');
const PushSubscriptionModel = require('../models/pushSubscriptionModel');
const { logger } = require('../middleware/loggerMiddleware');

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@example.com';

const isConfigured = Boolean(PUBLIC_KEY && PRIVATE_KEY);

/** Minimum gap between pushes for the same user + tag (one chat thread). */
const PUSH_THROTTLE_MS = 60 * 1000;
const lastPushByTag = new Map(); // `${userId}:${tag}` -> last push time (ms)
if (isConfigured) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

/**
 * Push a small JSON payload to every device a user has subscribed from.
 * Best-effort per device: one dead/unreachable subscription must not stop
 * delivery to the user's other devices, and a subscription the browser has
 * revoked (410 Gone) or that no longer exists (404) is cleaned up so it
 * isn't retried forever.
 */
async function sendToUser(userId, payload) {
  if (!isConfigured) {
    logger.warn('PUSH', 'VAPID keys are not configured — skipping push send.');
    return { sent: 0, failed: 0 };
  }
  if (!userId) return { sent: 0, failed: 0 };

  // One push per thread (tag) per window. A busy visitor chat would otherwise buzz
  // the owner's phone for every message; the messages are still in the dashboard.
  // Shared by the socket and REST paths, so one message can't push twice.
  if (payload?.tag) {
    const now = Date.now();
    const key = `${userId}:${payload.tag}`;
    if (now - (lastPushByTag.get(key) || 0) < PUSH_THROTTLE_MS) return { sent: 0, failed: 0, skipped: 'throttled' };
    lastPushByTag.set(key, now);
    if (lastPushByTag.size > 5000) {
      for (const [k, time] of lastPushByTag) {
        if (now - time > PUSH_THROTTLE_MS) lastPushByTag.delete(k);
      }
    }
  }

  const subscriptions = await PushSubscriptionModel.getAllForUser(userId);
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
        body
      );
      sent += 1;
    } catch (err) {
      failed += 1;
      if (err.statusCode === 404 || err.statusCode === 410) {
        await PushSubscriptionModel.removeByEndpoint(sub.endpoint).catch(() => {});
      } else {
        logger.warn('PUSH', `Push send failed for a subscription: ${err.message}`);
      }
    }
  }));

  return { sent, failed };
}

module.exports = { sendToUser, isConfigured, publicKey: PUBLIC_KEY };
