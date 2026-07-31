const AlertModel = require('../models/alertModel');
const { logger } = require('../middleware/loggerMiddleware');

class AlertController {
  /**
   * Dispatch & Save Emergency Alert
   */
  static async createAlert(req, res) {
    try {
      const alertPayload = req.body;
      logger.event('ALERT_EMERGENCY', '🚨', `Dispatching emergency alert for QR: ${alertPayload.qr_id || 'unknown'} (Type: ${alertPayload.type || 'SOS'})`);
      const result = await AlertModel.createAlert(alertPayload);
      logger.success('ALERT_EMERGENCY', `Alert dispatched successfully: ${result.id || 'ok'}`);
      return res.json({ success: true, data: result, message: 'Alert dispatched successfully' });
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
