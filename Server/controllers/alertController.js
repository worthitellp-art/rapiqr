const AlertModel = require('../models/alertModel');
const ProductModel = require('../models/productModel');
const ChatModel = require('../models/chatModel');
const { notifyOwner, notifyEmergencyContacts } = require('../services/notificationService');
const { getIo } = require('../sockets/chatSocket');
const { logger } = require('../middleware/loggerMiddleware');

// Same origin ChatController uses, so the owner lands on the dashboard inbox
// that already holds this visitor's thread.
const APP_URL = process.env.APP_URL || 'https://rapiqr.worthitellp.workers.dev';

const URL_RE = /(https?:\/\/\S+)/;

/**
 * Builds the chat-thread copy of an alert. A plain `.slice(0, 100)` here used
 * to truncate the whole message — for the common case of a quick-issue alert
 * whose text is "<alert type>\n<vehicle line>\n\n<description>\n📍 Location:
 * <maps url>", the Google Maps link routinely fell past character 100 and
 * got cut mid-URL (or dropped entirely), so the "open location" link the
 * owner saw in their chat inbox was broken. This truncates only the
 * free-text part and always appends the map URL (if any) in full.
 */
function buildAlertChatText(label, rawMessage) {
  if (!rawMessage) {
    return `RapiQR Alert: someone scanned and reported an issue with ${label}. Open the app for details.`;
  }
  const msg = String(rawMessage);
  const urlMatch = msg.match(URL_RE);
  if (!urlMatch) {
    const truncated = msg.length > 100 ? `${msg.slice(0, 97)}...` : msg;
    return `RapiQR Alert on ${label}: "${truncated}"`;
  }
  const url = urlMatch[0];
  const withoutUrl = (msg.slice(0, urlMatch.index) + msg.slice(urlMatch.index + url.length)).trim();
  const truncated = withoutUrl.length > 100 ? `${withoutUrl.slice(0, 97)}...` : withoutUrl;
  return truncated ? `RapiQR Alert on ${label}: "${truncated}"\n${url}` : `RapiQR Alert on ${label}\n${url}`;
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
      let smsResult = { sent: false, simulated: false, reason: 'no_owner_phone' };
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
      if (product && alertPayload.type !== 'location_ping') {
        const ownerPhone = product.details?.ownerPhone;
        const label = alertPayload.vehicleName || alertPayload.vehicleNumber || product.name || 'your RapiQR item';
        const text = buildAlertChatText(label, alertPayload.message);

        // Seed/continue the visitor's RepiChat thread with this alert first, so
        // the chat link below can point straight at that thread instead of just
        // the generic inbox — resolved ahead of notifyOwner deliberately.
        if (alertPayload.customerToken) {
          const { session } = await ChatModel.findOrCreateOpenSession({
            qrCodeId: qrId,
            customerToken: alertPayload.customerToken,
            customerName: alertPayload.customerName || 'Visitor',
            ownerId: product.user_id || null,
            vehicleLabel: `${product.name || 'Vehicle'}${product.vehicle_number ? ` (${product.vehicle_number})` : ''}`,
          });
          if (session) {
            chatSessionId = session.id;
            const chatMessage = await ChatModel.insertMessage({ sessionId: session.id, senderType: 'customer', senderId: null, body: text });
            if (chatMessage) getIo()?.to(`session:${session.id}`).emit('new_message', chatMessage);
          }
        }

        // The owner's copy carries a deep link into the dashboard inbox — when a
        // chat thread exists for this alert, straight into that thread, not just
        // the generic inbox the owner would otherwise have to search through.
        const chatLink = chatSessionId
          ? `${APP_URL}/#/dashboard?tab=chat&session=${chatSessionId}`
          : `${APP_URL}/#/dashboard?tab=chat`;

        // An alert that fans out to the family contact list is an emergency; one
        // that goes to the owner alone is a scan report. Same distinction the
        // notifyContacts flag already draws, now reflected in the template used.
        if (ownerPhone) {
          const result = await notifyOwner({
            type: notifyContacts ? 'EMERGENCY_ALERT' : 'QR_SCAN_ALERT',
            ownerPhone,
            data: { label, message: alertPayload.message || 'an issue was reported', link: chatLink },
            eventId: alertPayload.productId || qrId,
          });
          // The scan page renders this receipt; `simulated` covers both the mock
          // provider and a live provider with no credentials, so the visitor is
          // never told a message was delivered when it was not.
          smsResult = { sent: result.sent && !result.mock, simulated: result.mock || result.status === 'simulated' };
        }

        const emergencyContacts = notifyContacts && Array.isArray(product.details?.emergencyContacts)
          ? product.details.emergencyContacts
          : [];
        if (emergencyContacts.length > 0) {
          const contactResult = await notifyEmergencyContacts({
            contacts: emergencyContacts,
            data: { label, message: alertPayload.message || 'an issue was reported' },
            eventId: alertPayload.productId || qrId,
          });
          contactsNotified = contactResult.delivered;
        }
      }

      return res.json({ success: true, data: result, smsResult, contactsNotified, chatSessionId, message: 'Alert dispatched successfully' });
    } catch (err) {
      logger.error('ALERT_EMERGENCY', 'Failed to dispatch alert', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get Alerts Log
   */
  static async getAlerts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      logger.info('ALERT_LIST', `Fetching emergency alerts log (limit: ${limit})`);
      const data = await AlertModel.getAlerts(limit);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ALERT_LIST', 'Failed to fetch alerts log', err);
      return res.status(500).json({ success: false, error: err.message });
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
      return res.json({ success: true, message: 'All alerts deleted successfully', data: result });
    } catch (err) {
      logger.error('ALERT_DELETE_ALL', 'Failed to delete all alerts', err);
      return res.status(500).json({ success: false, error: err.message });
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
      return res.status(500).json({ success: false, error: err.message });
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
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = AlertController;
