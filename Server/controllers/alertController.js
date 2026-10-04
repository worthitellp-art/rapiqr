const AlertModel = require('../models/alertModel');
const ProductModel = require('../models/productModel');
const ChatModel = require('../models/chatModel');
const { notifyOwner, notifyEmergencyContacts, formatWait } = require('../services/notificationService');
const MessageModel = require('../models/messageModel');
const { buildMapsLink } = require('../services/msg91Templates');
const { createChatLoginLink } = require('../services/loginLinkService');
const { getIo } = require('../sockets/chatSocket');
const { logger } = require('../middleware/loggerMiddleware');
const { sendServerError } = require('../utils/httpErrors');
const { clampLimit } = require('../utils/pagination');
const { logAuditEvent } = require('../services/auditService');
const SecurityEventTypes = require('../utils/securityEventTypes');

const URL_RE = /(https?:\/\/\S+)/;

/**
 * WhatsApp anti-spam: the owner gets at most one WhatsApp per chat thread per
 * window. Alerts are still saved and the chat message still lands in the
 * thread, so nothing is lost — only the repeat notification is held back.
 * In-memory, so a server restart resets it (acceptable for a short window).
 */
const OWNER_WHATSAPP_COOLDOWN_MS = 5 * 60 * 1000;
const OWNER_WHATSAPP_COOLDOWN_EMERGENCY_MS = 60 * 1000;
const ownerWhatsAppSentAt = new Map(); // threadKey -> last WhatsApp time (ms)

/**
 * Builds the chat-thread copy of an alert. A plain `.slice(0, 100)` here used
 * to truncate the whole message — for the common case of a quick-issue alert
 * whose text is "<alert type>\n<vehicle line>\n\n<description>\n📍 Location:
 * <maps url>", the Google Maps link routinely fell past character 100 and
 * got cut mid-URL (or dropped entirely), so the "open location" link the
 * owner saw in their chat inbox was broken. This truncates only the
 * free-text part and always appends the map URL (if any) in full.
 */
/** Longest free-text description kept in the chat thread copy of an alert. */
const CHAT_TEXT_MAX = 600;

function buildAlertChatText(label, rawMessage) {
  if (!rawMessage) {
    return `RepiQR Alert: someone scanned and reported an issue with ${label}. Open the app for details.`;
  }
  const msg = String(rawMessage);
  const urlMatch = msg.match(URL_RE);
  if (!urlMatch) {
    const truncated = msg.length > CHAT_TEXT_MAX ? `${msg.slice(0, CHAT_TEXT_MAX - 3)}...` : msg;
    return `RepiQR Alert on ${label}: "${truncated}"`;
  }
  const url = urlMatch[0];
  const withoutUrl = (msg.slice(0, urlMatch.index) + msg.slice(urlMatch.index + url.length)).trim();
  const truncated = withoutUrl.length > CHAT_TEXT_MAX ? `${withoutUrl.slice(0, CHAT_TEXT_MAX - 3)}...` : withoutUrl;
  return truncated ? `RepiQR Alert on ${label}: "${truncated}"\n${url}` : `RepiQR Alert on ${label}\n${url}`;
}

class AlertController {
  /**
   * Dispatch & Save Emergency Alert
   */
  static async createAlert(req, res) {
    try {
      const alertPayload = req.body;
      const qrId = alertPayload.qrId || alertPayload.qr_id || alertPayload.qr_code_id;
      logger.event('ALERT_EMERGENCY', '🚨', `Dispatching emergency alert for QR: ${qrId || 'unknown'} (Type: ${alertPayload.type || 'SOS'})`);

      // Resolve the product up front — needed both to stamp product_id onto the
      // report (without it, the alert is orphaned and never shows up in the
      // owner's per-sticker Alert History, which filters strictly by product_id)
      // and to know who to notify below.
      const product = qrId ? await ProductModel.getByQrCodeId(qrId).catch(() => null) : null;
      if (product?.id && !alertPayload.productId && !alertPayload.product_id) {
        alertPayload.productId = product.id;
      }

      const result = await AlertModel.createAlert(alertPayload);
      logger.success('ALERT_EMERGENCY', `Alert dispatched successfully: ${result.id || 'ok'}`);

      // Best-effort WhatsApp to the sticker owner AND, for emergencies, their
      // registered emergency contacts. SMS is deliberately not used and is not a
      // fallback for this launch (see services/notificationService.js).
      let smsResult = {
        sent: false,
        simulated: false,
        reason: 'no_owner_phone',
        detail: 'No owner phone number is saved for this sticker, so WhatsApp could not be sent.',
      };
      let contactsNotified = 0;
      let chatSessionId = null;

      // SEND_SMS buttons on the category scan pages notify the OWNER ONLY — a
      // blocked driveway or a found wallet is not a reason to wake the whole
      // family contact list. Defaults to true so the emergency paths that
      // already relied on the fan-out (SOS, live-location share) are unchanged.
      const notifyContacts = alertPayload.notifyContacts !== false;

      // A `location_ping` is the every-5-seconds live-location trail sent
      // while the installed PWA has the emergency screen open (see
      // ScanPage.tsx) — it must still land in Alert History with real GPS
      // coordinates (handled above via AlertModel.createAlert), but firing a
      // WhatsApp message to the owner on every one of those would spam them
      // once every 5 seconds. The one-time "Share My Location" action still
      // uses type "emergency" and notifies as normal.
      // Live location trail: one card in the visitor's chat thread that the server
      // updates in place (socket 'live_location'). Pings never add a chat message
      // and never send WhatsApp — WhatsApp goes out once, from the first share.
      if (alertPayload.type === 'location_ping' && alertPayload.customerToken && alertPayload.latitude && alertPayload.longitude) {
        const { session } = await ChatModel.findOrCreateOpenSession({
          qrCodeId: qrId,
          customerToken: alertPayload.customerToken,
          customerName: alertPayload.customerName || 'Visitor',
          ownerId: product?.user_id || null,
          vehicleLabel: `${product?.name || 'Vehicle'}${product?.vehicle_number ? ` (${product.vehicle_number})` : ''}`,
        });
        if (session) {
          const live = {
            lat: Number(alertPayload.latitude),
            lng: Number(alertPayload.longitude),
            accuracy: Number(alertPayload.accuracy) || null,
            updated_at: new Date().toISOString(),
          };
          await ChatModel.setLiveLocation(session.id, live);
          const payload = { sessionId: session.id, ...live };
          getIo()?.to(`session:${session.id}`).emit('live_location', payload);
          if (product?.user_id) getIo()?.to(`owner:${product.user_id}`).emit('live_location', payload);
        }
      }

      if ((product || alertPayload.ownerPhone) && alertPayload.type !== 'location_ping') {
        const ownerPhone = product?.details?.ownerPhone || product?.phone_number || product?.details?.phone || product?.details?.phoneNumber || product?.profiles?.phone_number || alertPayload.ownerPhone;
        const label = alertPayload.vehicleName || alertPayload.vehicleNumber || product?.name || 'your RepiQR item';
        const text = buildAlertChatText(label, alertPayload.message);

        // Seed/continue the visitor's RepiChat thread with this alert first, so
        // the chat link below can point straight at that thread instead of just
        // the generic inbox — resolved ahead of notifyOwner deliberately.
        if (alertPayload.customerToken) {
          const { session } = await ChatModel.findOrCreateOpenSession({
            qrCodeId: qrId,
            customerToken: alertPayload.customerToken,
            customerName: alertPayload.customerName || 'Visitor',
            ownerId: product?.user_id || null,
            vehicleLabel: `${product?.name || 'Vehicle'}${product?.vehicle_number ? ` (${product.vehicle_number})` : ''}`,
          });
          if (session) {
            chatSessionId = session.id;
            const chatMessage = await ChatModel.insertMessage({ sessionId: session.id, senderType: 'customer', senderId: null, body: text });
            if (chatMessage) getIo()?.to(`session:${session.id}`).emit('new_message', chatMessage);
          }
        }

        // Send WhatsApp alert to the owner using the approved Meta templates.
        // Each one has an "open dashboard" URL button whose parameter is the
        // chat session id (msg91Client sends a placeholder when there is none,
        // since Meta rejects an empty button parameter).
        const isEmergencyAlert = alertPayload.type === 'emergency' || alertPayload.type === 'sos';
        const throttleKey = `${qrId}:${chatSessionId || alertPayload.customerToken || 'anon'}`;
        const cooldownMs = isEmergencyAlert ? OWNER_WHATSAPP_COOLDOWN_EMERGENCY_MS : OWNER_WHATSAPP_COOLDOWN_MS;
        const withinCooldown = Date.now() - (ownerWhatsAppSentAt.get(throttleKey) || 0) < cooldownMs;
        if (withinCooldown) {
          const retryAfterSec = Math.ceil((cooldownMs - (Date.now() - (ownerWhatsAppSentAt.get(throttleKey) || 0))) / 1000);
          const detail = `The owner was already sent a WhatsApp for this chat moments ago. The next one is allowed in ${formatWait(retryAfterSec)}.`;
          smsResult = { sent: false, simulated: false, status: 'held', reason: 'thread_cooldown', retryAfterSec, detail };
          if (ownerPhone) {
            MessageModel.record({
              channel: 'whatsapp',
              to: ownerPhone,
              event: `NOTIFY_${isEmergencyAlert ? 'EMERGENCY_ALERT' : 'QR_SCAN_ALERT'}`,
              status: 'held',
              error: detail,
            });
          }
        }

        if (ownerPhone && !withinCooldown) {
          const isEmergency = isEmergencyAlert;
          const hasGps = Boolean(alertPayload.latitude && alertPayload.longitude);
          const isLocationShare = alertPayload.type === 'location_share' || String(alertPayload.message || '').includes('EMERGENCY GPS LOCATION');

          // `session` fills the template's "open dashboard" URL button.
          let alertType = 'QR_SCAN_ALERT';
          let alertData = { item_name: label, message: alertPayload.message || 'an issue was reported', session: chatSessionId };

          if (hasGps && isLocationShare) {
            alertType = 'LOCATION_SHARED';
            alertData = { item_name: label, message: `Live location: ${buildMapsLink(alertPayload.latitude, alertPayload.longitude)}`, session: chatSessionId };
          } else if (isEmergency) {
            alertType = 'EMERGENCY_ALERT';
            alertData = { item_name: label, message: alertPayload.message || 'an urgent alert was reported', session: chatSessionId };
          }

          // The owner's button carries a one-time login token (see loginLinkService),
          // so it signs them in from any browser. Emergency contacts never get one.
          const ownerLinkSession = product?.user_id && chatSessionId
            ? await createChatLoginLink({ userId: product.user_id, sessionId: chatSessionId })
            : chatSessionId;
          alertData = { ...alertData, session: ownerLinkSession };

          ownerWhatsAppSentAt.set(throttleKey, Date.now());
          const result = await notifyOwner({
            type: alertType,
            ownerPhone,
            data: alertData,
            eventId: alertPayload.productId || qrId,
          });
          // The scan page renders this receipt; `simulated` covers both the mock
          // provider and a live provider with no credentials, so the visitor is
          // never told a message was delivered when it was not.
          // Pass the real outcome through: whether it was sent, held back (with
          // how long until it's allowed again), capped, or rejected by the provider.
          smsResult = {
            sent: Boolean(result.sent && !result.mock),
            simulated: Boolean(result.mock || result.status === 'simulated'),
            status: result.status,
            reason: result.reason,
            retryAfterSec: result.retryAfterSec ?? null,
            detail: result.detail || null,
          };
        }

        // The owner already got their own copy above — don't message them again
        // just because their number is also saved as an emergency contact.
        const lastTen = (value) => String(value || '').replace(/\D/g, '').slice(-10);
        // Contacts are a separate audience from the owner: the owner's chat cooldown
        // must not silence them. notify() still debounces each contact on its own.
        const emergencyContacts = notifyContacts && Array.isArray(product.details?.emergencyContacts)
          ? product.details.emergencyContacts.filter((c) => !ownerPhone || lastTen(c?.phone) !== lastTen(ownerPhone))
          : [];
        if (emergencyContacts.length > 0) {
          const contactResult = await notifyEmergencyContacts({
            contacts: emergencyContacts,
            data: { item_name: label, message: alertPayload.message || 'an issue was reported', session: chatSessionId },
            eventId: alertPayload.productId || qrId,
          });
          contactsNotified = contactResult.delivered;
        }
      }

      return res.json({ success: true, data: result, smsResult, contactsNotified, chatSessionId, message: 'Alert dispatched successfully' });
    } catch (err) {
      logger.error('ALERT_EMERGENCY', 'Failed to dispatch alert', err);
      return sendServerError(res, err);
    }
  }

  /**
   * Get Alerts Log
   */
  static async getAlerts(req, res) {
    try {
      const limit = clampLimit(req.query.limit, { fallback: 50, max: 500 });
      logger.info('ALERT_LIST', `Fetching emergency alerts log (limit: ${limit})`);
      const data = await AlertModel.getAlerts(limit);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ALERT_LIST', 'Failed to fetch alerts log', err);
      return sendServerError(res, err);
    }
  }

  /**
   * Delete all alerts (Admin only)
   * DELETE /api/alerts
   */
  static async deleteAllAlerts(req, res) {
    try {
      logger.info('ALERT_DELETE_ALL', 'Deleting all emergency alerts');
      const result = await AlertModel.deleteAllAlerts();
      await logAuditEvent({
        eventType: SecurityEventTypes.DATA_DELETED,
        actorType: 'ADMIN',
        req,
        resourceType: 'Alert',
        metadata: { action: 'delete_all_alerts', deletedCount: result?.deletedCount ?? null },
      });
      return res.json({ success: true, message: 'All alerts deleted successfully', data: result });
    } catch (err) {
      logger.error('ALERT_DELETE_ALL', 'Failed to delete all alerts', err);
      return sendServerError(res, err);
    }
  }

  /**
   * Delete single alert by ID (Admin only)
   * DELETE /api/alerts/:id
   */
  static async deleteAlert(req, res) {
    try {
      const { id } = req.params;
      logger.info('ALERT_DELETE_ONE', `Deleting alert ${id}`);
      const result = await AlertModel.deleteAlert(id);
      return res.json({ success: true, message: 'Alert deleted successfully', data: result });
    } catch (err) {
      logger.error('ALERT_DELETE_ONE', 'Failed to delete alert', err);
      return sendServerError(res, err);
    }
  }

  /**
   * Resolve an alert (Admin only)
   * PATCH /api/alerts/:id/resolve
   */
  static async resolveAlert(req, res) {
    try {
      const { id } = req.params;
      logger.info('ALERT_RESOLVE', `Resolving alert ${id}`);
      const result = await AlertModel.resolveAlert(id);
      return res.json({ success: true, message: 'Alert marked as resolved', data: result });
    } catch (err) {
      logger.error('ALERT_RESOLVE', 'Failed to resolve alert', err);
      return sendServerError(res, err);
    }
  }
}

module.exports = AlertController;
