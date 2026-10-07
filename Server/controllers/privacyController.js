const PrivacyModel = require('../models/privacyModel');
const GrievanceModel = require('../models/grievanceModel');
const UserModel = require('../models/userModel');
const QrModel = require('../models/qrModel');
const AlertModel = require('../models/alertModel');
const ChatModel = require('../models/chatModel');
const { deleteUserAccount } = require('../services/accountDeletionService');
const { logAuditEvent } = require('../services/auditService');
const SecurityEventTypes = require('../utils/securityEventTypes');
const { PROCESSORS } = require('../config/processorRegistry');
const { logger } = require('../middleware/loggerMiddleware');
const { createOtp, verifyOtp } = require('../services/phoneVerificationService');
const { sendWhatsAppOtp, sendSmsOtp } = require('../services/smsService');
const { normalizePhone } = require('../utils/phone');
const { uploadPublicFile } = require('../services/storageService');
const crypto = require('crypto');

// Same allowlist/size cap as chat image attachments (chatController.js) — no
// reason for avatars to be more permissive.
const AVATAR_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
const AVATAR_MAX_BYTES = 4 * 1024 * 1024;

// Bump this whenever PrivacyPolicyPage.tsx's substantive content changes —
// consent records and /privacy/me both cite it so "what did they actually
// agree to" stays answerable (task.md §5). Not read from the frontend file
// itself: keeping it a plain constant here is the source of truth the API
// signs consent against.
const CURRENT_NOTICE_VERSION = '2026-09-26.1';

class PrivacyController {
  /** GET /api/privacy/me — what RepiQR holds and does with this account's data. */
  static async me(req, res) {
    try {
      const profile = await UserModel.findById(req.user.id);
      const consents = await PrivacyModel.getCurrentStatus(req.user.id);
      const nominee = await PrivacyModel.getNominee(req.user.id);
      return res.json({
        success: true,
        data: {
          profile,
          nominee,
          consents,
          noticeVersion: CURRENT_NOTICE_VERSION,
          processingActivities: [
            { purpose: 'Account authentication', dataUsed: ['email', 'phone_number', 'password_hash/OTP'], basis: 'SERVICE' },
            { purpose: 'Sticker activation & emergency contact display', dataUsed: ['name', 'phone_number', 'address', 'blood_group', 'allergies', 'emergency_contacts'], basis: 'SERVICE' },
            { purpose: 'Order fulfillment', dataUsed: ['name', 'address', 'phone_number', 'email'], basis: 'SERVICE' },
            { purpose: 'Marketing communications', dataUsed: ['email', 'phone_number'], basis: 'CONSENT' },
          ],
          sharedWith: PROCESSORS,
        },
      });
    } catch (err) {
      logger.error('PRIVACY_ME', 'PrivacyController.me failed', err);
      return res.status(500).json({ success: false, error: 'Failed to load privacy summary' });
    }
  }

  /** PATCH /api/privacy/me — thin wrapper over the existing profile-update path (task.md §48: no duplicate systems). */
  static async updateMe(req, res) {
    try {
      const { fullName, phoneNumber, avatarUrl } = req.body || {};
      const updated = await UserModel.updateProfile(req.user.id, { fullName, phoneNumber, avatarUrl });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('PRIVACY_UPDATE_ME', 'PrivacyController.updateMe failed', err);
      return res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }

  /**
   * POST /api/privacy/avatar — Account Settings' "upload a photo" control.
   * Takes a base64 data URL (same convention as chat image attachments, see
   * chatController.sendAttachment) rather than multipart, stores it through
   * the shared storage service (S3 or local-disk fallback), and saves the
   * resulting URL straight onto the profile.
   */
  static async uploadAvatar(req, res) {
    try {
      const { image } = req.body || {};
      if (!image) return res.status(400).json({ success: false, error: 'image (base64 data URL) is required' });

      const mimeMatch = String(image).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      if (!AVATAR_ALLOWED_TYPES.includes(contentType)) {
        return res.status(400).json({ success: false, error: `Unsupported image type: ${contentType}` });
      }

      const buffer = Buffer.from(mimeMatch ? String(image).split(',')[1] : String(image), 'base64');
      if (!buffer.length) return res.status(400).json({ success: false, error: 'The image data was empty or malformed.' });
      if (buffer.length > AVATAR_MAX_BYTES) {
        return res.status(413).json({
          success: false,
          error: `That image is ${(buffer.length / 1024 / 1024).toFixed(1)} MB — the limit is ${AVATAR_MAX_BYTES / 1024 / 1024} MB.`,
        });
      }

      const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      // Random filename, not the user's: avoids collisions and doesn't leak
      // anything about the original file.
      const key = `avatars/${req.user.id}/${crypto.randomUUID()}.${ext}`;
      const publicUrl = await uploadPublicFile(key, buffer, contentType);

      const updated = await UserModel.updateProfile(req.user.id, { avatarUrl: publicUrl });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('AVATAR_UPLOAD', 'PrivacyController.uploadAvatar failed', err);
      return res.status(500).json({ success: false, error: 'Failed to upload avatar' });
    }
  }

  /** GET /api/privacy/sharing — the processor registry, in plain terms. */
  static async sharing(req, res) {
    return res.json({ success: true, data: PROCESSORS });
  }

  /** GET /api/privacy/consent — current status per purpose. */
  static async listConsent(req, res) {
    try {
      const data = await PrivacyModel.getCurrentStatus(req.user.id);
      return res.json({ success: true, data, noticeVersion: CURRENT_NOTICE_VERSION });
    } catch (err) {
      logger.error('PRIVACY_CONSENT_LIST', 'PrivacyController.listConsent failed', err);
      return res.status(500).json({ success: false, error: 'Failed to load consent status' });
    }
  }

  /** POST /api/privacy/consent — grant one purpose. Each purpose is separate: no bundled "agree to all". */
  static async grantConsent(req, res) {
    try {
      const { purpose, dataCategories } = req.body || {};
      if (!PrivacyModel.CONSENT_PURPOSES.includes(purpose)) {
        return res.status(400).json({ success: false, error: `purpose must be one of: ${PrivacyModel.CONSENT_PURPOSES.join(', ')}` });
      }

      const record = await PrivacyModel.recordConsent({
        userId: req.user.id,
        purpose,
        status: 'GRANTED',
        dataCategories: Array.isArray(dataCategories) ? dataCategories : [],
        noticeVersion: CURRENT_NOTICE_VERSION,
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      });

      await logAuditEvent({
        eventType: SecurityEventTypes.CONSENT_GRANTED,
        actorType: 'USER',
        req,
        resourceType: 'Consent',
        resourceId: record.id,
        metadata: { purpose },
      });

      return res.json({ success: true, data: record });
    } catch (err) {
      logger.error('PRIVACY_CONSENT_GRANT', 'PrivacyController.grantConsent failed', err);
      return res.status(500).json({ success: false, error: 'Failed to record consent' });
    }
  }

  /**
   * POST /api/privacy/consent/withdraw — as easy as granting (task.md §6:
   * withdrawal must be "reasonably as easy as giving consent"). Only stops
   * the processing that purpose covers; it does not touch unrelated data or
   * SERVICE-basis processing.
   */
  static async withdrawConsent(req, res) {
    try {
      const { purpose } = req.body || {};
      if (!PrivacyModel.CONSENT_PURPOSES.includes(purpose)) {
        return res.status(400).json({ success: false, error: `purpose must be one of: ${PrivacyModel.CONSENT_PURPOSES.join(', ')}` });
      }

      const record = await PrivacyModel.recordConsent({
        userId: req.user.id,
        purpose,
        status: 'WITHDRAWN',
        noticeVersion: CURRENT_NOTICE_VERSION,
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      });

      await logAuditEvent({
        eventType: SecurityEventTypes.CONSENT_WITHDRAWN,
        actorType: 'USER',
        req,
        resourceType: 'Consent',
        resourceId: record.id,
        metadata: { purpose },
      });

      return res.json({ success: true, data: record });
    } catch (err) {
      logger.error('PRIVACY_CONSENT_WITHDRAW', 'PrivacyController.withdrawConsent failed', err);
      return res.status(500).json({ success: false, error: 'Failed to withdraw consent' });
    }
  }

  /**
   * POST /api/privacy/erasure-otp — step 1 of self-service deletion: send a
   * code to the account's own phone. Deletion is irreversible, so the JWT
   * alone (proves "signed in as this account") isn't enough on its own —
   * this adds a second factor the way password reset already does.
   */
  static async sendErasureOtp(req, res) {
    try {
      const profile = await UserModel.findById(req.user.id);
      if (!profile?.phone_number) {
        return res.status(400).json({ success: false, error: 'No phone number on this account — add one in Account Settings first so we can verify it\'s really you before deleting.' });
      }
      const norm = normalizePhone(profile.phone_number);
      const code = createOtp(`delete:${req.user.id}`, profile.phone_number);
      const text = `Your RapiQR account deletion verification code is ${code}. Valid for 5 minutes. Didn't request this? Ignore this message.`;
      sendWhatsAppOtp({ to: profile.phone_number, code, event: 'ACCOUNT_DELETE_WHATSAPP' }).catch(() => {});
      sendSmsOtp({ to: profile.phone_number, code, body: text, event: 'ACCOUNT_DELETE_SMS' }).catch(() => {});
      logger.security('ACCOUNT_DELETE_OTP_SENT', `Account deletion OTP dispatched to ${norm} for user ${req.user.id}`);
      return res.json({ success: true, message: 'Verification code sent to your phone number.' });
    } catch (err) {
      logger.error('ACCOUNT_DELETE_OTP_SEND', 'Failed to send account deletion OTP', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to send verification code.' });
    }
  }

  /**
   * POST /api/privacy/erasure-request — step 2: verify the code from
   * sendErasureOtp, then auto-fulfill through the existing account-deletion
   * service rather than sitting in a manual queue. The PrivacyRequest record
   * is what makes that auditable (task.md §26). Also drops an alert the
   * admin fleet dashboard already shows (Alert History) so admin knows this
   * account/id was deleted, since the user row won't exist to look up after.
   */
  static async requestErasure(req, res) {
    let request;
    try {
      const code = req.body?.code;
      if (!code || !String(code).trim()) {
        return res.status(400).json({ success: false, error: 'Verification code is required.' });
      }
      const verification = verifyOtp(`delete:${req.user.id}`, String(code).trim());
      if (!verification.ok) {
        const messages = {
          no_pending_otp: 'No active verification code — please request a new one.',
          expired: 'Verification code has expired — please request a new one.',
          too_many_attempts: 'Too many incorrect attempts — please request a new code.',
          invalid_code: `Incorrect code.${verification.attemptsLeft ? ` ${verification.attemptsLeft} attempt(s) left.` : ''}`,
        };
        return res.status(400).json({ success: false, error: messages[verification.reason] || 'Verification failed.' });
      }

      // Snapshot identity before the row is gone — the admin alert and audit
      // trail need something a human can recognize, not just a deleted id.
      const profileSnapshot = await UserModel.findById(req.user.id).catch(() => null);

      request = await PrivacyModel.createPrivacyRequest({ userId: req.user.id, type: 'ERASURE', reason: req.body?.reason });

      await logAuditEvent({
        eventType: SecurityEventTypes.ERASURE_REQUESTED,
        actorType: 'USER',
        req,
        resourceType: 'PrivacyRequest',
        resourceId: request.id,
      });

      await deleteUserAccount(req.user.id);
      const fulfilled = await PrivacyModel.markRequestFulfilled(request.id, 'Auto-fulfilled via self-service erasure.');

      await logAuditEvent({
        eventType: SecurityEventTypes.DATA_DELETED,
        actorType: 'USER',
        req,
        userId: req.user.id,
        resourceType: 'User',
        resourceId: req.user.id,
        reason: 'Self-service erasure request fulfilled',
      });

      // Best-effort admin-visible alert — must never block the deletion itself.
      AlertModel.createAlert({
        productLabel: profileSnapshot?.full_name || profileSnapshot?.phone_number || profileSnapshot?.email || 'Unknown user',
        type: 'account_deleted',
        message: `Account deleted via self-service erasure (OTP-verified). Name: ${profileSnapshot?.full_name || 'N/A'} • Phone: ${profileSnapshot?.phone_number || 'N/A'} • Email: ${profileSnapshot?.email || 'N/A'} • User ID: ${req.user.id}`,
      }).catch((alertErr) => logger.warn('ACCOUNT_DELETE_ALERT', `Failed to create admin alert: ${alertErr.message}`));

      return res.json({ success: true, data: fulfilled });
    } catch (err) {
      logger.error('PRIVACY_ERASURE', 'PrivacyController.requestErasure failed', err);
      if (request?.id) await PrivacyModel.markRequestFailed(request.id, err.message).catch(() => {});
      return res.status(500).json({ success: false, error: 'Failed to process erasure request' });
    }
  }

  /** GET /api/privacy/export — machine-readable export of this account's own data (task.md §27). */
  static async exportData(req, res) {
    try {
      const userId = req.user.id;
      const [profile, stickers, sessions, consents, privacyRequests] = await Promise.all([
        UserModel.findById(userId),
        QrModel.getOwnedByUserId(userId),
        ChatModel.listSessionsForOwner(userId),
        PrivacyModel.getCurrentStatus(userId),
        PrivacyModel.listOwnRequests(userId),
      ]);
      const alerts = await AlertModel.getByStickerIds(stickers.map((s) => s.id));

      await logAuditEvent({
        eventType: SecurityEventTypes.DATA_EXPORTED,
        actorType: 'USER',
        req,
        userId,
        resourceType: 'User',
        resourceId: userId,
      });

      return res.json({
        success: true,
        data: {
          exportedAt: new Date().toISOString(),
          profile,
          sticker_data: stickers,
          emergency_data: alerts,
          visitor_data: sessions,
          consents,
          sharing: PROCESSORS,
          privacy_requests: privacyRequests,
        },
      });
    } catch (err) {
      logger.error('PRIVACY_EXPORT', 'PrivacyController.exportData failed', err);
      return res.status(500).json({ success: false, error: 'Failed to build data export' });
    }
  }

  /** POST /api/privacy/nominee */
  static async setNominee(req, res) {
    try {
      const { name, relationship, contactPhone, contactEmail } = req.body || {};
      if (!name || (!contactPhone && !contactEmail)) {
        return res.status(400).json({ success: false, error: 'name and at least one of contactPhone/contactEmail are required' });
      }
      const nominee = await PrivacyModel.setNominee(req.user.id, { name, relationship, contactPhone, contactEmail });
      return res.json({ success: true, data: nominee });
    } catch (err) {
      logger.error('PRIVACY_NOMINEE', 'PrivacyController.setNominee failed', err);
      return res.status(500).json({ success: false, error: 'Failed to save nominee' });
    }
  }

  /**
   * POST /api/privacy/grievances — works for both signed-in users and
   * anonymous visitors (e.g. someone reporting a public scan page issue who
   * doesn't have/want an account). Anonymous submitters must leave a way to
   * be reached; authenticated ones don't need to.
   */
  static async submitGrievance(req, res) {
    try {
      const { category, description, contactEmail, contactPhone } = req.body || {};
      if (!description || !description.trim()) {
        return res.status(400).json({ success: false, error: 'description is required' });
      }
      if (!req.user && !contactEmail && !contactPhone) {
        return res.status(400).json({ success: false, error: 'contactEmail or contactPhone is required when not signed in' });
      }

      const grievance = await GrievanceModel.create({
        userId: req.user?.id || null,
        contactEmail,
        contactPhone,
        category,
        description: description.trim(),
      });

      await logAuditEvent({
        eventType: SecurityEventTypes.GRIEVANCE_SUBMITTED,
        actorType: req.user ? 'USER' : 'ANONYMOUS',
        req,
        resourceType: 'Grievance',
        resourceId: grievance.id,
        metadata: { category: category || 'general' },
      });

      return res.json({ success: true, data: grievance });
    } catch (err) {
      logger.error('PRIVACY_GRIEVANCE_SUBMIT', 'PrivacyController.submitGrievance failed', err);
      return res.status(500).json({ success: false, error: 'Failed to submit grievance' });
    }
  }

  /** GET /api/privacy/grievances — the signed-in user's own tickets only. */
  static async listOwnGrievances(req, res) {
    try {
      const data = await GrievanceModel.listOwn(req.user.id);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('PRIVACY_GRIEVANCE_LIST', 'PrivacyController.listOwnGrievances failed', err);
      return res.status(500).json({ success: false, error: 'Failed to load grievances' });
    }
  }

  /** GET /api/admin/privacy/grievances — admin queue. */
  static async adminListGrievances(req, res) {
    try {
      const data = await GrievanceModel.getAll({ status: req.query.status });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('PRIVACY_GRIEVANCE_ADMIN_LIST', 'PrivacyController.adminListGrievances failed', err);
      return res.status(500).json({ success: false, error: 'Failed to load grievances' });
    }
  }

  /** PATCH /api/admin/privacy/grievances/:id — admin: respond and/or change status. */
  static async adminUpdateGrievance(req, res) {
    try {
      const { status, responseMessage, resolution } = req.body || {};
      const updated = await GrievanceModel.updateStatus(req.params.id, {
        status,
        responseMessage,
        respondedBy: req.user.email || req.user.id,
        resolution,
      });
      if (!updated) return res.status(404).json({ success: false, error: 'Grievance not found' });

      await logAuditEvent({
        eventType: SecurityEventTypes.GRIEVANCE_STATUS_CHANGED,
        actorType: 'ADMIN',
        req,
        resourceType: 'Grievance',
        resourceId: req.params.id,
        metadata: { status },
      });

      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('PRIVACY_GRIEVANCE_ADMIN_UPDATE', 'PrivacyController.adminUpdateGrievance failed', err);
      return res.status(500).json({ success: false, error: 'Failed to update grievance' });
    }
  }
}

module.exports = PrivacyController;
