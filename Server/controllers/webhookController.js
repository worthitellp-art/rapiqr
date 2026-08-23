const crypto = require('crypto');
const { logger } = require('../middleware/loggerMiddleware');
const MessageModel = require('../models/messageModel');

/**
 * WhatsApp webhook.
 *
 * Structure only — no provider is connected yet. It implements the handshake and
 * delivery-status shape the Meta Cloud API uses (Gupshup and Twilio differ in
 * payload but not in what we do with it: map a provider message id to a status).
 *
 * Nothing here invents credentials. With WHATSAPP_VERIFY_TOKEN unset the
 * verification handshake FAILS CLOSED rather than accepting any token, so an
 * unconfigured deployment cannot be subscribed to by a third party.
 */

/** Meta sends the delivery receipt; other BSPs use their own names for the same states. */
const STATUS_MAP = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  deleted: 'failed',
};

class WebhookController {
  /**
   * GET /api/webhooks/whatsapp — subscription handshake.
   * Echoes hub.challenge only when the token matches the configured secret.
   */
  static verify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expected = (process.env.WHATSAPP_VERIFY_TOKEN || '').trim();
    if (!expected) {
      logger.warn('WHATSAPP_WEBHOOK', 'Verification attempted but WHATSAPP_VERIFY_TOKEN is not set — refusing.');
      return res.status(503).send('Webhook not configured');
    }

    // Fixed-length compare so a wrong token cannot be discovered by timing.
    const provided = String(token || '');
    const ok =
      mode === 'subscribe' &&
      provided.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

    if (!ok) {
      logger.warn('WHATSAPP_WEBHOOK', 'Verification failed — token mismatch.');
      return res.sendStatus(403);
    }

    logger.success('WHATSAPP_WEBHOOK', 'Webhook verified.');
    return res.status(200).send(challenge);
  }

  /**
   * POST /api/webhooks/whatsapp — delivery receipts and inbound messages.
   *
   * Always answers 200: every BSP retries (and eventually disables) a webhook
   * that errors, and a payload we cannot parse is our problem, not a reason to
   * make them replay it.
   */
  static async receive(req, res) {
    try {
      if (!WebhookController.isSignatureValid(req)) {
        logger.warn('WHATSAPP_WEBHOOK', 'Rejected a payload with an invalid signature.');
        return res.sendStatus(403);
      }

      const statuses = WebhookController.extractStatuses(req.body);
      for (const status of statuses) {
        await MessageModel.updateStatusByProviderId?.(status.id, status.status);
        logger.event('WHATSAPP_WEBHOOK', '📬', `Delivery update ${status.id} -> ${status.status}`);
      }

      // Inbound replies are logged but not yet routed into RepiChat: the mapping
      // from a WhatsApp sender to a chat session needs the real provider's
      // payload shape to be built against, which we do not have until the API is
      // purchased. Logged so tomorrow's integration has real samples to work from.
      const inbound = req.body?.entry?.[0]?.changes?.[0]?.value?.messages;
      if (Array.isArray(inbound) && inbound.length) {
        logger.info('WHATSAPP_WEBHOOK', `Received ${inbound.length} inbound message(s) — not yet routed into RepiChat.`);
      }

      return res.sendStatus(200);
    } catch (err) {
      logger.error('WHATSAPP_WEBHOOK', 'Failed to process webhook payload', err);
      return res.sendStatus(200);
    }
  }

  /**
   * Verifies X-Hub-Signature-256 when an app secret is configured.
   * Without a secret this returns true — the webhook is inert anyway until a
   * provider is connected, and refusing everything would hide the payload
   * samples we want while testing. Set WHATSAPP_APP_SECRET before going live.
   */
  static isSignatureValid(req) {
    const secret = (process.env.WHATSAPP_APP_SECRET || '').trim();
    if (!secret) return true;

    const header = req.get('x-hub-signature-256') || '';
    const raw = req.rawBody;
    if (!raw) {
      logger.warn('WHATSAPP_WEBHOOK', 'No raw body captured — cannot verify signature.');
      return false;
    }

    const expected = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
    if (header.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  }

  /** Pull delivery receipts out of a Meta-shaped payload. */
  static extractStatuses(body) {
    const out = [];
    for (const entry of body?.entry || []) {
      for (const change of entry?.changes || []) {
        for (const status of change?.value?.statuses || []) {
          if (status?.id) out.push({ id: status.id, status: STATUS_MAP[status.status] || String(status.status || 'unknown') });
        }
      }
    }
    return out;
  }
}

module.exports = WebhookController;
