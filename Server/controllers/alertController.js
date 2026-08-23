const AlertModel = require('../models/alertModel');
const ProductModel = require('../models/productModel');
const ChatModel = require('../models/chatModel');
const { notifyOwner, notifyEmergencyContacts } = require('../services/notificationService');
const { getIo } = require('../sockets/chatSocket');
const { logger } = require('../middleware/loggerMiddleware');

// Same origin ChatController uses, so the owner lands on the dashboard inbox
// that already holds this visitor's thread.
const APP_URL = process.env.APP_URL || 'https://rapiqr.worthitellp.workers.dev';

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

      if (product) {
        const ownerPhone = product.details?.ownerPhone;
        const label = alertPayload.vehicleName || alertPayload.vehicleNumber || product.name || 'your RapiQR item';
        const text = alertPayload.message
          ? `RapiQR Alert on ${label}: "${String(alertPayload.message).slice(0, 100)}"`
          : `RapiQR Alert: someone scanned and reported an issue with ${label}. Open the app for details.`;

        // The owner's copy carries a deep link into the dashboard inbox, so the
        // notification is the entry point into the chat with whoever scanned the
        // tag. Contacts don't get it — that inbox isn't theirs.
        const chatLink = `${APP_URL}/#/dashboard?tab=chat`;

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

        // Seed/continue the visitor's RepiChat thread with this alert so it
        // shows up in the owner's chat inbox in real time.
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
}

module.exports = AlertController;
