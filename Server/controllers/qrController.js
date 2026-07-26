const QrModel = require('../models/qrModel');

class QrController {
  /**
   * Get all registered QR codes
   */
  static async getQrCodes(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const data = await QrModel.getAll(limit);
      return res.json({ success: true, data });
    } catch (err) {
      console.error('QrController.getQrCodes Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get QR code details by ID
   */
  static async getQrCodeById(req, res) {
    try {
      const { id } = req.params;
      const data = await QrModel.getById(id);
      if (!data) {
        return res.status(404).json({ success: false, error: 'QR Code not found' });
      }
      return res.json({ success: true, data });
    } catch (err) {
      console.error('QrController.getQrCodeById Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Save or Update QR Code record
   */
  static async saveQrCode(req, res) {
    try {
      const qrData = req.body;
      const saved = await QrModel.save(qrData);
      return res.json({ success: true, data: saved });
    } catch (err) {
      console.error('QrController.saveQrCode Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Activate QR Code
   */
  static async activateQrCode(req, res) {
    try {
      const { id } = req.params;
      const activationData = req.body;
      const activated = await QrModel.activate(id, activationData);
      return res.json({ success: true, data: activated });
    } catch (err) {
      console.error('QrController.activateQrCode Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Record QR Scan event
   */
  static async recordScan(req, res) {
    try {
      const { id } = req.params;
      const updated = await QrModel.recordScan(id);
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('QrController.recordScan Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = QrController;
