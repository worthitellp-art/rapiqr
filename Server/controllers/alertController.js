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
const { WHATSAPP_ERROR_CODES, createWhatsAppError } = require('../utils/whatsappErrorCatalog');

const URL_RE = /(https?:\/\/\S+)/;


const OWNER_WHATSAPP_COOLDOWN_MS = 60 * 1000; // 1 min for general chat
const OWNER_WHATSAPP_COOLDOWN_EMERGENCY_MS = 4 * 1000; // 4s rapid double-click guard for emergencies
const ownerWhatsAppSentAt = new Map(); // threadKey -> last WhatsApp time (ms)


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

     
      const product = qrId ? await ProductModel.getByQrCodeId(qrId).catch(() => null) : null;
      if (product?.id && !alertPayload.productId && !alertPayload.product_id) {
        alertPayload.productId = product.id;
      }

      const result = await AlertModel.createAlert(alertPayload);
      logger.success('ALERT_EMERGENCY', `Alert dispatched successfully: ${result.id || 'ok'}`);

      // Best-effort WhatsApp to the sticker owner AND, for emergencies, their
      // registered emergency contacts. SMS is deliberately not used and is not a
      // fallback for this launch (see services/notificationService.js).
      const noOwnerPhoneError = createWhatsAppError({
        code: WHATSAPP_ERROR_CODES.NO_RECIPIENT_PHONE,
        source: 'app',
        whatFailed: 'No owner contact phone found',
        whyFailed: 'No phone number is saved for this sticker, so WhatsApp alert could not be delivered.',
        safeNextAction: 'The owner should configure their phone number in the Client Dashboard. You can still message them via in-app RepiChat.',
      });
      let smsResult = {
        sent: false,
        simulated: false,
        reason: 'no_owner_phone',
        detail: noOwnerPhoneError.error.whyFailed,
        error: noOwnerPhoneError,
      };
      let contactsNotified = 0;
      let chatSessionId = null;

     
      const notifyContacts = alertPayload.notifyContacts !== false;

      
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
        const typeStr = String(alertPayload.type || '').toLowerCase();
        const msgStr = String(alertPayload.message || '').toLowerCase();
        const isEmergencyAlert =
          typeStr === 'emergency' ||
          typeStr === 'sos' ||
          typeStr.includes('emergency') ||
          typeStr.includes('accident') ||
          typeStr.includes('medical') ||
          typeStr.includes('theft') ||
          msgStr.includes('emergency') ||
          msgStr.includes('sos') ||
          msgStr.includes('urgent');

        const throttleKey = `${qrId}:${chatSessionId || alertPayload.customerToken || 'anon'}`;
        const cooldownMs = isEmergencyAlert ? OWNER_WHATSAPP_COOLDOWN_EMERGENCY_MS : OWNER_WHATSAPP_COOLDOWN_MS;
        const withinCooldown = Date.now() - (ownerWhatsAppSentAt.get(throttleKey) || 0) < cooldownMs;
        if (withinCooldown) {
          const retryAfterSec = Math.ceil((cooldownMs - (Date.now() - (ownerWhatsAppSentAt.get(throttleKey) || 0))) / 1000);
          const detail = isEmergencyAlert
            ? `An emergency WhatsApp was already dispatched to the owner moments ago. Next alert allowed in ${formatWait(retryAfterSec)}.`
            : `The owner was already sent a WhatsApp for this chat moments ago. The next one is allowed in ${formatWait(retryAfterSec)}.`;
          const cooldownError = createWhatsAppError({
            code: WHATSAPP_ERROR_CODES.RATE_LIMIT_THREAD_COOLDOWN,
            source: 'app',
            whatFailed: isEmergencyAlert ? 'Emergency WhatsApp already sent' : 'Owner already notified',
            whyFailed: detail,
            safeNextAction: 'Your message has been posted directly to the owner’s in-app chat thread. They will see it when they open RepiQR.',
            retryAfterSec,
          });
          smsResult = { sent: false, simulated: false, status: 'held', reason: 'thread_cooldown', retryAfterSec, detail, error: cooldownError };
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
            detail: result.detail || result.error?.error?.whyFailed || null,
            error: result.error || null,
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
