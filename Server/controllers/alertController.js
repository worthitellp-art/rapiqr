const AlertModel = require('../models/alertModel');

class AlertController {
  /**
   * Dispatch & Save Emergency Alert
   */
  static async createAlert(req, res) {
    try {
      const alertPayload = req.body;
      const result = await AlertModel.createAlert(alertPayload);
      return res.json({ success: true, data: result, message: 'Alert dispatched successfully' });
    } catch (err) {
      console.error('AlertController.createAlert Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get Alerts Log
   */
  static async getAlerts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const data = await AlertModel.getAlerts(limit);
      return res.json({ success: true, data });
    } catch (err) {
      console.error('AlertController.getAlerts Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = AlertController;
