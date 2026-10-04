const UserModel = require('../models/userModel');
const ProductModel = require('../models/productModel');
const MessageModel = require('../models/messageModel');
const LogModel = require('../models/logModel');
const QrModel = require('../models/qrModel');
const Sticker = require('../models/schemas/Sticker');
const { logger, maskPhone, maskEmail } = require('../middleware/loggerMiddleware');
const { sendEmail } = require('../services/emailService');
const { createResetLink } = require('../services/passwordResetService');
const { deleteUserAccount } = require('../services/accountDeletionService');
const { logAuditEvent } = require('../services/auditService');
const SecurityEventTypes = require('../utils/securityEventTypes');

// Sensitive fields are masked in every admin listing/detail response by
// default (task.md §13: "Mask sensitive fields by default. Only authorised
// roles should be able to reveal sensitive information... Every reveal/
// export/delete action should be auditable"). Pass ?reveal=true to get raw
// values back — doing so is itself audit-logged as PII_REVEALED.
function isRevealRequested(req) {
  return String(req.query.reveal || '').toLowerCase() === 'true';
}

function maskUserFields(user) {
  if (!user) return user;
  return {
    ...user,
    email: user.email ? maskEmail(user.email) : user.email,
    phone_number: user.phone_number ? maskPhone(user.phone_number) : user.phone_number,
  };
}

function maskStickerFields(sticker) {
  if (!sticker) return sticker;
  const masked = { ...sticker };
  if (masked.details) {
    masked.details = {
      ...masked.details,
      ownerPhone: masked.details.ownerPhone ? maskPhone(masked.details.ownerPhone) : masked.details.ownerPhone,
      ownerEmail: masked.details.ownerEmail ? maskEmail(masked.details.ownerEmail) : masked.details.ownerEmail,
    };
  }
  if (masked.profiles) {
    masked.profiles = {
      ...masked.profiles,
      email: masked.profiles.email ? maskEmail(masked.profiles.email) : masked.profiles.email,
      phone_number: masked.profiles.phone_number ? maskPhone(masked.profiles.phone_number) : masked.profiles.phone_number,
    };
  }
  return masked;
}

class AdminController {
  /**
   * Support console: list/search every user account with their sticker count.
   * GET /api/admin/users?search=&reveal=true
   */
  static async listUsers(req, res) {
    try {
      const { search } = req.query;
      const reveal = isRevealRequested(req);
      const users = await UserModel.searchAll(search, 1000);

      const counts = await Sticker.aggregate([
        { $match: { user_id: { $ne: null } } },
        { $group: { _id: '$user_id', count: { $sum: 1 } } },
      ]);
      const countMap = {};
      counts.forEach((r) => { countMap[String(r._id)] = r.count; });

      const data = users
        .map((u) => ({ ...u, stickerCount: countMap[u.id] || 0 }))
        .map((u) => (reveal ? u : maskUserFields(u)));

      await logAuditEvent({
        eventType: reveal ? SecurityEventTypes.PII_REVEALED : SecurityEventTypes.ADMIN_ACCESS,
        actorType: 'ADMIN',
        req,
        resourceType: 'User',
        metadata: { action: 'list', count: data.length, search: search || null },
      });

      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ADMIN_USERS_LIST', 'Failed to list users', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Support console: single user's profile + all their stickers.
   * GET /api/admin/users/:id?reveal=true
   */
  static async getUserDetail(req, res) {
    try {
      const { id } = req.params;
      const reveal = isRevealRequested(req);
      const profile = await UserModel.findById(id);
      if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

      const products = await ProductModel.getAllByUser(id);
      const data = {
        profile: reveal ? profile : maskUserFields(profile),
        products: reveal ? products : products.map(maskStickerFields),
      };

      await logAuditEvent({
        eventType: reveal ? SecurityEventTypes.PII_REVEALED : SecurityEventTypes.ADMIN_ACCESS,
        actorType: 'ADMIN',
        req,
        resourceType: 'User',
        resourceId: id,
        metadata: { action: 'detail' },
      });

      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ADMIN_USER_DETAIL', `Failed to fetch user ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Support console: this user's login/logout/action audit trail — the same
   * ServerLog records the Live Logs feed reads, scoped to one user_id, so
   * sign-ins, sign-outs, and every request they made while authenticated
   * (correlated via authMiddleware's setUserId call) show up newest-first.
   * GET /api/admin/users/:id/activity
   */
  static async getUserActivity(req, res) {
    try {
      const { id } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
      const data = await LogModel.getLogs({ userId: id, limit });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ADMIN_USER_ACTIVITY', `Failed to fetch activity for user ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Support console: search stickers across every account by QR code id, owner
   * name/phone/email, or vehicle number — for locating a sticker when the caller
   * only has the physical sticker ID, not the account it's linked to.
   * GET /api/admin/stickers?search=
   */
  static async searchStickers(req, res) {
    try {
      const { search } = req.query;
      const reveal = isRevealRequested(req);
      const rows = await ProductModel.searchAll(search, 500);
      const data = reveal ? rows : rows.map(maskStickerFields);

      await logAuditEvent({
        eventType: reveal ? SecurityEventTypes.PII_REVEALED : SecurityEventTypes.ADMIN_ACCESS,
        actorType: 'ADMIN',
        req,
        resourceType: 'Sticker',
        metadata: { action: 'search', count: data.length, search: search || null },
      });

      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ADMIN_STICKER_SEARCH', 'Failed to search stickers', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * On-demand, audited recovery-code reveal for the "See Codes" toggle and
   * the recovery-code CSV export — replaces getAll() ever embedding codes in
   * the routine fleet listing (see qrModel.js.getAll's comment).
   * POST /api/admin/stickers/reveal-recovery-codes  body: { ids: string[] }
   */
  static async revealRecoveryCodes(req, res) {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids.slice(0, 1000) : [];
      if (ids.length === 0) return res.status(400).json({ success: false, error: 'ids (array) is required' });

      const codes = await QrModel.getRecoveryCodesByIds(ids);

      await logAuditEvent({
        eventType: SecurityEventTypes.PII_REVEALED,
        actorType: 'ADMIN',
        req,
        resourceType: 'Sticker',
        metadata: { action: 'reveal_recovery_codes', count: ids.length, stickerIds: ids },
      });

      return res.json({ success: true, data: codes });
    } catch (err) {
      logger.error('ADMIN_REVEAL_RECOVERY_CODES', 'Failed to reveal recovery codes', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Lost-access support: generate a password recovery link for a user (e.g.
   * they lost the phone with their authenticator app and can't sign in to
   * change anything themselves) and email it to them. If SMTP isn't configured,
   * the link is still returned so the admin can relay it through another channel.
   * POST /api/admin/users/:id/reset-password
   */
  static async triggerPasswordReset(req, res) {
    try {
      const { id } = req.params;
      const profile = await UserModel.findById(id);
      if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

      const actionLink = await createResetLink(profile);

      const emailResult = await sendEmail({
        to: profile.email,
        subject: 'RepiQR — Password Reset Requested by Support',
        html: `<p>Hi ${profile.full_name || ''},</p><p>Our support team triggered a password reset for your RepiQR account on your behalf. Click the link below to set a new password:</p><p><a href="${actionLink}">${actionLink}</a></p><p>If you did not contact support, you can ignore this email.</p>`,
        event: 'ADMIN_PASSWORD_RESET_EMAIL',
      });

      logger.security('ADMIN_PASSWORD_RESET_TRIGGERED', `Admin ${req.user.email} triggered a password reset for ${profile.email}`, {
        actorId: req.user.id,
        actorEmail: req.user.email,
        targetUserId: id,
        targetEmail: profile.email,
        emailSent: emailResult.sent,
      });

      return res.json({
        success: true,
        message: emailResult.sent
          ? `Password reset email sent to ${profile.email}`
          : `Reset link generated — email not configured, relay this link to ${profile.email} directly`,
        emailSent: emailResult.sent,
        actionLink,
      });
    } catch (err) {
      logger.error('ADMIN_PASSWORD_RESET', `Failed to trigger password reset for ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Lost-access support override: force-disable a user's 2FA when they've lost the
   * device that had their authenticator app, so they can't complete the normal
   * password-confirmed disable flow themselves.
   * POST /api/admin/users/:id/disable-2fa
   */
  static async disableUserTwoFactor(req, res) {
    try {
      const { id } = req.params;
      const profile = await UserModel.findById(id);
      if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

      await UserModel.mergeMetadata(id, { twoFactor: { enabled: false } });

      logger.security('ADMIN_2FA_DISABLED', `Admin ${req.user.email} force-disabled 2FA for ${profile.email}`, {
        actorId: req.user.id,
        actorEmail: req.user.email,
        targetUserId: id,
        targetEmail: profile.email,
      });

      return res.json({ success: true, message: `2FA disabled for ${profile.email}` });
    } catch (err) {
      logger.error('ADMIN_2FA_DISABLE', `Failed to disable 2FA for ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Admin console: Delete a user account and all their linked records.
   * DELETE /api/admin/users/:id
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      const profile = await UserModel.findById(id);
      if (profile && profile.role === 'admin') {
        return res.status(403).json({ success: false, error: 'Administrator accounts cannot be deleted' });
      }

      // Same cascading unlink/delete used by the self-service "delete my
      // account" flow (unlink orders/stickers/distributor apps, clean up
      // chat sessions, then delete the account itself).
      await deleteUserAccount(id);

      const userEmail = profile?.email || id;
      logger.security('ADMIN_USER_DELETED', `Admin ${req.user.email} deleted user account ${userEmail}`, {
        actorId: req.user.id,
        targetUserId: id,
        targetEmail: userEmail,
      });

      return res.json({ success: true, message: `User account ${userEmail} deleted successfully` });
    } catch (err) {
      logger.error('ADMIN_USER_DELETE', `Failed to delete user account ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Message Manager: delivery stat tiles (total/sent/failed/simulated, by
   * channel, last 24h) — exact counts, not derived from the paginated list.
   * GET /api/admin/messages/stats
   */
  static async getMessageStats(req, res) {
    try {
      const stats = await MessageModel.getStats();
      return res.json({ success: true, data: stats });
    } catch (err) {
      logger.error('ADMIN_MESSAGE_STATS', 'Failed to fetch message stats', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Message Manager: recent SMS/WhatsApp send log (every Twilio attempt from
   * alerts, phone verification, and sticker activation OTP), newest first.
   * GET /api/admin/messages?limit=&channel=&status=&event=
   */
  static async listMessages(req, res) {
    try {
      const { channel, status, event } = req.query;
      const limit = Math.min(parseInt(req.query.limit) || 100, 500);
      const data = await MessageModel.getMessages({ limit, channel, status, event });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ADMIN_MESSAGE_LIST', 'Failed to fetch message log', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Message Manager: delete all tracked messages.
   * DELETE /api/admin/messages
   */
  static async deleteAllMessages(req, res) {
    try {
      const result = await MessageModel.deleteAllMessages();
      logger.info('ADMIN_MESSAGE_DELETE_ALL', `Deleted ${result.deletedCount} message records`);
      return res.json({ success: true, message: 'All messages deleted successfully', data: result });
    } catch (err) {
      logger.error('ADMIN_MESSAGE_DELETE_ALL', 'Failed to delete all messages', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = AdminController;
