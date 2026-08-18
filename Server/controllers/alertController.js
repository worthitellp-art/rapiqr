const AlertModel = require('../models/alertModel');
const ProductModel = require('../models/productModel');
const ChatModel = require('../models/chatModel');
const { sendSms } = require('../services/smsService');
const { getIo } = require('../sockets/chatSocket');
const { logger } = require('../middleware/loggerMiddleware');

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

      // Best-effort SMS to the sticker owner AND their registered emergency/family
      // contacts — real sends via Twilio, honestly reported back so the frontend
      // never claims "dispatched" on a channel that wasn't actually sent.
      // Emergency contacts are the "Emergency Panel" the owner configured in
      // their dashboard — a location share or alert should reach them the same
      // way it reaches the owner. The owner additionally gets this alert as a
      // real-time RepiChat message (replaces the old WhatsApp deep-link send).
      let smsResult = { sent: false, simulated: false, reason: 'no_owner_phone' };
      let contactsNotified = 0;
      let chatSessionId = null;

      if (product) {
        const ownerPhone = product.details?.ownerPhone;
        const label = alertPayload.vehicleName || alertPayload.vehicleNumber || product.name || 'your RapiQR item';
        const text = alertPayload.message
          ? `RapiQR Alert on ${label}: "${String(alertPayload.message).slice(0, 100)}"`
          : `RapiQR Alert: someone scanned and reported an issue with ${label}. Open the app for details.`;

        if (ownerPhone) {
          smsResult = await sendSms({ to: ownerPhone, body: text, event: 'ALERT_SMS' });
        }

        const emergencyContacts = Array.isArray(product.details?.emergencyContacts) ? product.details.emergencyContacts : [];
        const contactResults = await Promise.all(
          emergencyContacts
            .filter((c) => c?.phone)
            .map((c) => sendSms({ to: c.phone, body: text, event: 'ALERT_SMS_CONTACT' }))
        );
        contactsNotified = contactResults.filter((sms) => sms?.sent).length;

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
