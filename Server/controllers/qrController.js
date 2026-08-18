const QrModel = require('../models/qrModel');
const { supabaseAdmin } = require('../config/db');
const { logger } = require('../middleware/loggerMiddleware');
const { sendSms } = require('../services/smsService');
const { createOtp, verifyOtp } = require('../services/phoneVerificationService');

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
  /**
   * Save or Update QR Code record
   */
  static async saveQrCode(req, res) {
    try {
      const qrData = req.body;
      const saved = await QrModel.save(qrData);
      if (!saved) {
        logger.warn('QR_SAVE', `Failed to save QR Code row in database: ${qrData.id || 'unknown'}`);
        return res.status(500).json({ success: false, error: 'Failed to save QR Code record' });
      }
      logger.rowInserted('qr_codes', saved.id, { category: saved.category, template: saved.template_name, status: saved.status });
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
      logger.rowUpdated('qr_codes', id, { action: 'sticker_image_linked', sticker_image: publicUrl });
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
      const activated = await QrModel.activate(id, activationData);
      logger.rowUpdated('qr_codes', id, { action: 'activated', status: 'active' });
      return res.json({ success: true, data: activated });
    } catch (err) {
      logger.error('QR_ACTIVATE', `Failed to activate QR Code: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Activation identity check — step 1: send a real Twilio SMS OTP to the
   * phone the visitor is registering with. Public (no verifyToken) because
   * activation happens before any account exists — anonymous like /activate
   * itself. Keyed by qrId rather than a userId since there's no session yet;
   * one in-progress activation per sticker is an acceptable trade-off.
   *
   * Twilio trial accounts only deliver to Caller-ID-verified numbers — send
   * failures (e.g. code 21608 "unverified number") are returned as-is so the
   * frontend can surface them instead of silently pretending to succeed.
   */
  static async sendActivationOtp(req, res) {
    try {
      const { id } = req.params;
      const { phoneNumber } = req.body || {};
      const digits = String(phoneNumber || '').replace(/\D/g, '');
      if (!digits || digits.length < 7) {
        return res.status(400).json({ success: false, error: 'Enter a valid phone number.' });
      }

      const fullPhone = String(phoneNumber).trim().startsWith('+') ? String(phoneNumber).trim() : `+${digits}`;
      const code = createOtp(id, fullPhone);
      const body = `Your RapiQR activation code is ${code}. It expires in 5 minutes.`;
      const smsResult = await sendSms({ to: fullPhone, body, event: 'ACTIVATION_OTP_SMS' });

      logger.event('QR_ACTIVATION_OTP', '📲', `Activation OTP ${smsResult.sent ? 'sent' : smsResult.simulated ? 'simulated' : 'FAILED'} for QR ${id}`);

      if (!smsResult.sent && !smsResult.simulated) {
        return res.status(502).json({ success: false, simulated: false, error: smsResult.error || 'Could not send the verification SMS.' });
      }

      return res.json({ success: true, simulated: smsResult.simulated });
    } catch (err) {
      logger.error('QR_ACTIVATION_OTP', `Failed to send activation OTP for QR: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Activation identity check — step 2: verify the code. `000000` is the
   * shared master bypass baked into phoneVerificationService, for testing
   * when Twilio isn't sending (simulated mode / unverified test numbers).
   */
  static async verifyActivationOtp(req, res) {
    try {
      const { id } = req.params;
      const { code } = req.body || {};
      if (!code) return res.status(400).json({ success: false, error: 'Enter the code sent to your phone.' });

      const result = verifyOtp(id, code);
      if (!result.ok) {
        const messages = {
          no_pending_otp: 'No verification in progress — request a new code.',
          expired: 'This code has expired — request a new one.',
          too_many_attempts: 'Too many incorrect attempts — request a new code.',
          invalid_code: `Incorrect code.${result.attemptsLeft ? ` ${result.attemptsLeft} attempt(s) left.` : ''}`,
        };
        return res.status(400).json({ success: false, error: messages[result.reason] || 'Verification failed.' });
      }

      return res.json({ success: true, phone: result.phone });
    } catch (err) {
      logger.error('QR_ACTIVATION_OTP_VERIFY', `Failed to verify activation OTP for QR: ${req.params.id}`, err);
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
      logger.rowUpdated('qr_codes', id, { action: 'scan_recorded', scans_count: updated?.scans_count });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('QR_SCAN', `Failed to record scan for QR Code: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Delete single QR Code
   */
  static async deleteQrCode(req, res) {
    try {
      const { id } = req.params;
      const deleted = await QrModel.delete(id);
      logger.rowDeleted('qr_codes', id);
      return res.json({ success: true, data: deleted });
    } catch (err) {
      logger.error('QR_DELETE', `Failed to delete QR Code: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Delete all QR Codes
   */
  static async deleteAllQrCodes(req, res) {
    try {
      await QrModel.deleteAll();
      logger.info('QR_DELETE_ALL', 'All QR codes cleared');
      return res.json({ success: true });
    } catch (err) {
      logger.error('QR_DELETE_ALL', 'Failed to clear all QR codes', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = QrController;
