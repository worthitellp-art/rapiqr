const QrModel = require('../models/qrModel');
const { logger } = require('../middleware/loggerMiddleware');
const { notifyContactsAdded, notifyOwner } = require('../services/notificationService');

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
      if (err.code === 'DUPLICATE_PHONE') {
        return res.status(409).json({ success: false, error: err.message });
      }
      logger.error('QR_SAVE', 'Error saving QR Code record', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Create a QR code under id-scheme v2 — the server generates the recovery
   * code and derives the sticker id from it; the client supplies neither.
   * See QrModel.saveV2 / Server/services/stickerCrypto.js.
   */
  static async saveQrCodeV2(req, res) {
    try {
      const qrData = req.body || {};
      const saved = await QrModel.saveV2(qrData);
      if (!saved) {
        logger.warn('QR_SAVE_V2', 'Failed to save id-scheme v2 QR Code row in database');
        return res.status(500).json({ success: false, error: 'Failed to save QR Code record' });
      }
      logger.rowInserted('qr_codes', saved.id, { category: saved.category, template: saved.template_name, status: saved.status, idSchemeVersion: saved.idSchemeVersion });
      return res.json({ success: true, data: saved });
    } catch (err) {
      if (err.code === 'DUPLICATE_PHONE') {
        return res.status(409).json({ success: false, error: err.message });
      }
      logger.error('QR_SAVE_V2', 'Error saving id-scheme v2 QR Code record', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Code-only recovery for id-scheme v2 stickers — see QrModel.recoverByCodeV2.
   * Public: the recovery code itself is the proof of possession, same as the
   * existing v1 restore route.
   */
  static async recoverByCode(req, res) {
    try {
      const { recoveryCode } = req.body || {};
      if (!recoveryCode) {
        return res.status(400).json({ success: false, error: 'recoveryCode is required' });
      }

      const result = await QrModel.recoverByCodeV2(recoveryCode);
      if (!result.ok) {
        const messages = {
          invalid_format: 'That recovery code looks malformed — check for typos.',
          not_found: 'No sticker found with that recovery code.',
          hash_mismatch: 'That recovery code could not be verified.',
          integrity_failure: 'This sticker could not be regenerated — please contact support.',
          duplicate_phone: 'Another live tag already uses this phone number in the same category. Change or remove that tag first, then recover.',
        };
        if (result.reason === 'hash_mismatch' || result.reason === 'integrity_failure') {
          logger.error('QR_RECOVER_V2_INTEGRITY', `Recovery integrity failure (${result.reason})`);
        } else {
          logger.security('QR_RECOVER_V2_DENIED', `Recovery-by-code attempt failed (${result.reason})`);
        }
        const status = result.reason === 'duplicate_phone' ? 409
          : (result.reason === 'integrity_failure' || result.reason === 'hash_mismatch') ? 500
          : (result.reason === 'invalid_format' ? 400 : 404);
        return res.status(status).json({ success: false, error: messages[result.reason] || 'Recovery failed.' });
      }

      logger.security('QR_RECOVERED_V2', `Sticker ${result.data.id} regenerated via code-only recovery`);
      return res.json({
        success: true,
        data: result.data,
        image: `data:image/png;base64,${result.imageBase64}`,
        imageSha256: result.imageSha256,
      });
    } catch (err) {
      logger.error('QR_RECOVER_V2', 'Failed to recover QR by code', err);
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
      const { newlyAddedContacts, ...activated } = await QrModel.activate(id, activationData);
      logger.rowUpdated('qr_codes', id, { action: 'activated', status: 'active' });

      // Notify the owner that their tag is activated
      const ownerPhone = activationData.ownerPhone || activationData.phoneNumber;
      if (ownerPhone) {
        const label = activationData.vehicleNumber || activationData.vehicleName || 'your RepiQR tag';
        notifyOwner({
          type: 'QR_ACTIVATED',
          ownerPhone,
          data: { label },
          eventId: id,
        }).catch((err) => {
          logger.error('QR_ACTIVATED_NOTIFY', `Failed to notify owner for ${id}`, err);
        });
      } else {
        // Previously silent — this skip left zero trace anywhere (no log, no
        // ServerLog/messages row), which is exactly why "QR activated" alerts
        // appeared to never send: nothing recorded whether it was ever even
        // attempted. Surfacing it so a missing ownerPhone/phoneNumber on the
        // activation payload is visible in the admin Live Logs feed.
        logger.warn('QR_ACTIVATED_NOTIFY', `Skipped owner notification for ${id} — no ownerPhone/phoneNumber in activation payload`);
      }

      // Tell each newly-added emergency contact over WhatsApp that they've
      // been listed — fire-and-forget so a slow/failed send never blocks the
      // sticker owner's own activation response.
      if (Array.isArray(newlyAddedContacts) && newlyAddedContacts.length > 0) {
        notifyContactsAdded({
          contacts: newlyAddedContacts,
          ownerName: activationData.ownerName || 'A RapiQR user',
          eventId: id,
        }).catch((err) => {
          logger.error('EMERGENCY_CONTACT_NOTIFY', `Failed to notify emergency contacts for ${id}`, err);
        });
      }

      return res.json({ success: true, data: activated });
    } catch (err) {
      if (err.code === 'DUPLICATE_PHONE') {
        return res.status(409).json({ success: false, error: err.message });
      }
      if (/not found/i.test(err.message)) {
        return res.status(404).json({ success: false, error: err.message });
      }
      logger.error('QR_ACTIVATE', `Failed to activate QR Code: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Activation identity check — step 1: validate the phone the visitor is
   * registering with. The actual OTP send now happens entirely in the browser
   * via the MSG91 OTP Widget (see src/lib/msg91Widget.ts) — this endpoint is
   * just the pre-flight format check. Public (no verifyToken) because
   * activation happens before any account exists — anonymous like /activate
   * itself.
   */
  static async sendActivationOtp(req, res) {
    try {
      const { phoneNumber } = req.body || {};
      const digits = String(phoneNumber || '').replace(/\D/g, '');
      if (!digits || digits.length < 7) {
        return res.status(400).json({ success: false, error: 'Enter a valid phone number.' });
      }

      return res.json({ success: true });
    } catch (err) {
      logger.error('QR_ACTIVATION_OTP', `Failed to run activation OTP pre-check for QR: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Activation identity check — step 2: the browser already ran the OTP
   * exchange with MSG91's widget and got back an access token; this verifies
   * that token with MSG91 server-to-server and confirms it verified the SAME
   * number the client claims (never trusting the frontend's own "success").
   */
  static async verifyActivationOtp(req, res) {
    try {
      const { id } = req.params;
      const { accessToken, phoneNumber } = req.body || {};
      if (!accessToken) return res.status(400).json({ success: false, error: 'Missing verification token — please retry.' });
      const digits = String(phoneNumber || '').replace(/\D/g, '');
      if (!digits || digits.length < 7) {
        return res.status(400).json({ success: false, error: 'Enter a valid phone number.' });
      }

      const verification = await verifyMsg91WidgetAccessToken({ accessToken });
      if (!verification.success) {
        logger.security('QR_ACTIVATION_OTP_VERIFY_FAILED', `MSG91 widget token rejected for QR ${id}: ${verification.error || verification.reason}`);
        return res.status(400).json({ success: false, error: verification.error || 'Invalid or expired verification code.' });
      }

      // Compare on the last 10 digits when there are that many (India's national
      // significant number, same convention as Server/utils/phone.js), otherwise
      // fall back to the full digit string — this endpoint accepts numbers as
      // short as 7 digits, so a hard "must have 10" check would reject every
      // legitimately-verified short number.
      const verifiedDigits = String(verification.verifiedIdentifier || '').replace(/\D/g, '');
      const significantDigits = digits.length >= 10 ? digits.slice(-10) : digits;
      if (!verifiedDigits || !verifiedDigits.endsWith(significantDigits)) {
        logger.security('QR_ACTIVATION_OTP_MISMATCH', `Verified identifier didn't match claimed number for QR ${id}`);
        return res.status(400).json({ success: false, error: 'Verified number does not match — please retry.' });
      }

      const fullPhone = String(phoneNumber).trim().startsWith('+') ? String(phoneNumber).trim() : `+${digits}`;
      return res.json({ success: true, phone: fullPhone });
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
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'QR Code not found' });
      }
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

  /**
   * Restore a soft-deleted sticker on proof of its printed recovery code.
   * `not_found` covers both "no such sticker" and "wrong code" so the
   * response can't be used to enumerate valid sticker IDs.
   *
   * Mounted on two routes: an admin-only one (fleet dashboard "Restore
   * Sticker") and a public self-service one (client dashboard / lost-sticker
   * recovery) — the recovery code itself is the proof of ownership in both
   * cases, so `req.user` may be absent here.
   */
  static async restoreQrCode(req, res) {
    try {
      const { id } = req.params;
      const { recoveryCode } = req.body || {};
      if (!recoveryCode) {
        return res.status(400).json({ success: false, error: 'recoveryCode is required' });
      }

      const actor = req.user?.email || 'self-service';
      const result = await QrModel.restoreByRecoveryCode(id, recoveryCode);
      if (!result.ok) {
        const messages = {
          missing_fields: 'A sticker ID and recovery code are required.',
          not_found: 'No sticker found with that ID and recovery code.',
          not_deleted: 'This sticker is not currently deleted — nothing to restore.',
          duplicate_phone: 'Another live tag already uses this phone number in the same category. Change or remove that tag first, then restore.',
        };
        logger.security('QR_RESTORE_DENIED', `Restore attempt failed for ${id} (${result.reason}) by ${actor}`);
        const status = result.reason === 'duplicate_phone' ? 409 : (result.reason === 'not_deleted' ? 400 : 404);
        return res.status(status).json({ success: false, error: messages[result.reason] || 'Restore failed.' });
      }

      logger.security('QR_RESTORED', `Sticker ${id} restored via recovery code by ${actor}`);
      return res.json({ success: true, data: result.data });
    } catch (err) {
      logger.error('QR_RESTORE', `Failed to restore QR: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = QrController;
