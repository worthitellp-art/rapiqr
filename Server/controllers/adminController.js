const UserModel = require('../models/userModel');
const ProductModel = require('../models/productModel');
const MessageModel = require('../models/messageModel');
const LogModel = require('../models/logModel');
const QrModel = require('../models/qrModel');
const Sticker = require('../models/schemas/Sticker');
const Alert = require('../models/schemas/Alert');
const Order = require('../models/schemas/Order');
const DistributorApplication = require('../models/schemas/DistributorApplication');
const SmsMessage = require('../models/schemas/SmsMessage');
const { sendServerError } = require('../utils/httpErrors');
const { clampLimit } = require('../utils/pagination');
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
      return sendServerError(res, err);
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
      return sendServerError(res, err);
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
      const limit = clampLimit(req.query.limit, { fallback: 200, max: 1000 });
      const data = await LogModel.getLogs({ userId: id, limit });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ADMIN_USER_ACTIVITY', `Failed to fetch activity for user ${req.params.id}`, err);
      return sendServerError(res, err);
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
      return sendServerError(res, err);
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
      return sendServerError(res, err);
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
      await logAuditEvent({
        eventType: SecurityEventTypes.PASSWORD_RESET_REQUEST,
        actorType: 'ADMIN',
        req,
        resourceType: 'User',
        resourceId: id,
        metadata: { action: 'admin_triggered_reset', emailSent: emailResult.sent },
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
      return sendServerError(res, err);
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
      await logAuditEvent({
        eventType: SecurityEventTypes.MFA_DISABLED,
        actorType: 'ADMIN',
        req,
        resourceType: 'User',
        resourceId: id,
        metadata: { action: 'admin_force_disable_2fa' },
      });

      return res.json({ success: true, message: `2FA disabled for ${profile.email}` });
    } catch (err) {
      logger.error('ADMIN_2FA_DISABLE', `Failed to disable 2FA for ${req.params.id}`, err);
      return sendServerError(res, err);
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
      await logAuditEvent({
        eventType: SecurityEventTypes.USER_DELETED,
        actorType: 'ADMIN',
        req,
        resourceType: 'User',
        resourceId: id,
        metadata: { action: 'admin_delete_user' },
      });

      return res.json({ success: true, message: `User account ${userEmail} deleted successfully` });
    } catch (err) {
      logger.error('ADMIN_USER_DELETE', `Failed to delete user account ${req.params.id}`, err);
      return sendServerError(res, err);
    }
  }

  /**
   * Dashboard heartbeat: exact fleet totals plus the "needs attention" counts
   * in ONE small response (no rows, no PII). The admin console polls this
   * instead of re-downloading the alert, order and QR lists on three separate
   * timers, and only re-fetches a full list when these numbers actually change.
   * Counts come from the database, so they stay exact past any list page limit.
   * GET /api/admin/summary
   */
  static async getSummary(req, res) {
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // "Active" = the sticker is switched on OR already has an owner phone —
      // the same rule the fleet table applies row by row.
      const hasText = (path) => ({ $gt: [{ $strLenCP: { $convert: { input: `$${path}`, to: 'string', onError: '', onNull: '' } } }, 0] });

      const [tagAgg, unresolvedAlerts, ordersToShip, pendingPartners, failedMessages24h] = await Promise.all([
        Sticker.aggregate([
          { $match: { deleted_at: null } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: { $cond: [{ $or: [{ $eq: ['$status', 'active'] }, hasText('details.ownerPhone'), hasText('phone_number')] }, 1, 0] },
              },
              scans: { $sum: { $ifNull: ['$scans_count', 0] } },
              lastCreatedAt: { $max: '$created_at' },
            },
          },
        ]),
        Alert.countDocuments({ status: { $ne: 'resolved' } }),
        // Paid orders still waiting to be shipped ('pending' = legacy 'placed').
        Order.countDocuments({ status: { $in: ['placed', 'pending'] }, 'payment.status': 'paid' }),
        DistributorApplication.countDocuments({ status: 'pending' }),
        SmsMessage.countDocuments({ status: 'failed', created_at: { $gte: since24h } }),
      ]);

      const tags = tagAgg[0] || { total: 0, active: 0, scans: 0, lastCreatedAt: null };

      return res.json({
        success: true,
        data: {
          tags: {
            total: tags.total,
            active: tags.active,
            inactive: Math.max(0, tags.total - tags.active),
            scans: tags.scans,
            lastCreatedAt: tags.lastCreatedAt || null,
          },
          attention: { unresolvedAlerts, ordersToShip, pendingPartners, failedMessages24h },
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      logger.error('ADMIN_SUMMARY', 'Failed to build dashboard summary', err);
      return sendServerError(res, err);
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
      return sendServerError(res, err);
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
      const limit = clampLimit(req.query.limit, { fallback: 100, max: 500 });
      const data = await MessageModel.getMessages({ limit, channel, status, event });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ADMIN_MESSAGE_LIST', 'Failed to fetch message log', err);
      return sendServerError(res, err);
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
      await logAuditEvent({
        eventType: SecurityEventTypes.DATA_DELETED,
        actorType: 'ADMIN',
        req,
        resourceType: 'SmsMessage',
        metadata: { action: 'delete_all_messages', deletedCount: result.deletedCount },
      });
      return res.json({ success: true, message: 'All messages deleted successfully', data: result });
    } catch (err) {
      logger.error('ADMIN_MESSAGE_DELETE_ALL', 'Failed to delete all messages', err);
      return sendServerError(res, err);
    }
  }

  /**
   * WhatsApp Diagnostics: configuration & provider readiness audit.
   * GET /api/admin/whatsapp/diagnostics
   */
  static async getWhatsAppDiagnostics(req, res) {
    try {
      const { getMsg91Config } = require('../services/msg91Client');
      const { resolveWhatsAppProvider } = require('../services/smsService');
      const { MSG91_TEMPLATES } = require('../services/msg91Templates');

      const config = getMsg91Config();
      const activeProvider = resolveWhatsAppProvider();

      const diagnostics = {
        activeProvider,
        isConfigured: config.isConfigured,
        hasAuthKey: Boolean(config.authKey),
        authKeyPrefix: config.authKey ? `${config.authKey.slice(0, 6)}...` : null,
        integratedNumber: config.whatsappIntegratedNumber || null,
        hasIntegratedNumber: Boolean(config.whatsappIntegratedNumber),
        defaultTemplateName: config.whatsappTemplateName || null,
        namespace: config.whatsappTemplateNamespace || null,
        languageCode: config.whatsappLanguageCode || 'en',
        availableTemplates: Object.entries(MSG91_TEMPLATES).map(([type, tpl]) => ({
          type,
          name: tpl.name,
          audience: tpl.audience,
          variables: tpl.variables,
        })),
        envProviderSetting: process.env.WHATSAPP_PROVIDER || process.env.NOTIFICATION_PROVIDER || 'not explicitly set',
      };

      return res.json({ success: true, data: diagnostics });
    } catch (err) {
      logger.error('ADMIN_WHATSAPP_DIAGNOSTICS', 'Failed to fetch WhatsApp diagnostics', err);
      return sendServerError(res, err);
    }
  }

  /**
   * WhatsApp Live Test Dispatch: sends a test template message and traces entire pipeline.
   * POST /api/admin/whatsapp/test-send
   */
  static async testWhatsAppSend(req, res) {
    try {
      const { recipientPhone, templateType = 'QR_SCAN_ALERT', itemName = 'Test Tag', messageText = 'Live diagnostic test alert' } = req.body || {};
      if (!recipientPhone) {
        return res.status(400).json({ success: false, error: 'recipientPhone is required' });
      }

      const { notifyOwner } = require('../services/notificationService');
      logger.info('ADMIN_WHATSAPP_TEST', `Initiating test WhatsApp send to ${recipientPhone} (${templateType})`);

      const result = await notifyOwner({
        type: templateType,
        ownerPhone: recipientPhone,
        data: { item_name: itemName, message: messageText, session: 'admin-diagnostic-test' },
        eventId: 'admin-test',
      });

      return res.json({
        success: Boolean(result.sent),
        data: result,
        message: result.sent ? 'Test WhatsApp delivered to MSG91 successfully' : 'Test WhatsApp dispatch failed',
      });
    } catch (err) {
      logger.error('ADMIN_WHATSAPP_TEST', 'Test WhatsApp dispatch failed with exception', err);
      return sendServerError(res, err);
    }
  }
}

module.exports = AdminController;
