const QrModel = require('../models/qrModel');
const { supabaseAdmin } = require('../config/db');
const { logger } = require('../middleware/loggerMiddleware');

class QrController {
  /**
   * Get all registered QR codes
   */
  static async getQrCodes(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      logger.info('QR_LIST', `Fetching QR code fleet records (limit: ${limit})`);
      const data = await QrModel.getAll(limit);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('QR_LIST', 'Failed to fetch QR records', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get QR code details by ID
   */
  static async getQrCodeById(req, res) {
    try {
      const { id } = req.params;
      logger.info('QR_FETCH', `Fetching details for QR ID: ${id}`);
      const data = await QrModel.getById(id);
      if (!data) {
        logger.warn('QR_FETCH', `QR Code not found: ${id}`);
        return res.status(404).json({ success: false, error: 'QR Code not found' });
      }
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('QR_FETCH', `Error fetching QR ID: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Save or Update QR Code record
   */
  static async saveQrCode(req, res) {
    try {
      const qrData = req.body;
      logger.event('QR_SAVE', '💾', `Saving QR Code record: ${qrData.id || 'new'}`);
      const saved = await QrModel.save(qrData);
      logger.success('QR_SAVE', `QR Code record saved: ${saved.id}`);
      return res.json({ success: true, data: saved });
    } catch (err) {
      logger.error('QR_SAVE', 'Error saving QR Code record', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Save a generated sticker image to the "Stickers" storage bucket
   * and persist its public URL on the qr_codes record.
   * Body: { image: "<base64 data URL>" }
   */
  static async saveStickerImage(req, res) {
    try {
      const { id } = req.params;
      const { image } = req.body || {};

      if (!image) {
        return res.status(400).json({ success: false, error: 'image (base64 data URL) is required' });
      }

      const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/png';
      const ext = contentType.includes('avif') ? 'avif' : 'png';
      const base64 = mimeMatch ? image.split(',')[1] : image;
      const buffer = Buffer.from(base64, 'base64');

      const fileName = `stickers/${id}.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('Stickers')
        .upload(fileName, buffer, { upsert: true, contentType });

      if (uploadError) throw uploadError;

      const { data: pub } = supabaseAdmin.storage.from('Stickers').getPublicUrl(fileName);
      const publicUrl = pub.publicUrl;

      const saved = await QrModel.saveStickerImage(id, publicUrl);
      logger.success('STICKER_SAVE', `Sticker image saved for QR: ${id} → ${publicUrl}`);
      return res.json({ success: true, data: saved, stickerImage: publicUrl });
    } catch (err) {
      logger.error('STICKER_SAVE', `Failed to save sticker image for QR: ${req.params.id}`, err);
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
      logger.event('QR_ACTIVATE', '⚡', `Activating QR Code: ${id}`);
      const activated = await QrModel.activate(id, activationData);
      logger.success('QR_ACTIVATE', `QR Code activated: ${id}`);
      return res.json({ success: true, data: activated });
    } catch (err) {
      logger.error('QR_ACTIVATE', `Failed to activate QR Code: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Record QR Scan event
   */
  static async recordScan(req, res) {
    try {
      const { id } = req.params;
      logger.event('QR_SCAN', '📱', `Scan event recorded for QR Code: ${id}`);
      const updated = await QrModel.recordScan(id);
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('QR_SCAN', `Failed to record scan for QR Code: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = QrController;
