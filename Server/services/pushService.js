const webpush = require('web-push');
const PushSubscriptionModel = require('../models/pushSubscriptionModel');
const { logger } = require('../middleware/loggerMiddleware');

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@example.com';

const isConfigured = Boolean(PUBLIC_KEY && PRIVATE_KEY);
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
