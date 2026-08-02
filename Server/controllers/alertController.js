const AlertModel = require('../models/alertModel');
const ProductModel = require('../models/productModel');
const { sendSms, sendWhatsApp } = require('../services/smsService');
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
      const result = await AlertModel.createAlert(alertPayload);
      logger.success('ALERT_EMERGENCY', `Alert dispatched successfully: ${result.id || 'ok'}`);

      // Best-effort SMS + WhatsApp to the sticker owner — real sends via Twilio
      // (task.md #5/#18/#19), honestly reported back so the frontend never claims
      // "dispatched" on a channel that wasn't actually sent.
      let smsResult = { sent: false, simulated: false, reason: 'no_owner_phone' };
      let whatsappResult = { sent: false, simulated: false, reason: 'no_owner_phone' };
      if (qrId) {
        const product = await ProductModel.getByQrCodeId(qrId).catch(() => null);
        const ownerPhone = product?.details?.ownerPhone;
        if (ownerPhone) {
          const label = alertPayload.vehicleName || alertPayload.vehicleNumber || product.name || 'your RapiQR item';
          const text = alertPayload.message
            ? `RapiQR Alert on ${label}: "${String(alertPayload.message).slice(0, 100)}"`
            : `RapiQR Alert: someone scanned and reported an issue with ${label}. Open the app for details.`;
          [smsResult, whatsappResult] = await Promise.all([
            sendSms({ to: ownerPhone, body: text, event: 'ALERT_SMS' }),
            sendWhatsApp({ to: ownerPhone, body: text, event: 'ALERT_WHATSAPP' }),
          ]);
        }
      }

      return res.json({ success: true, data: result, smsResult, whatsappResult, message: 'Alert dispatched successfully' });
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
