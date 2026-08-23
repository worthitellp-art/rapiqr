const UserModel = require('../models/userModel');
const ProductModel = require('../models/productModel');
const MessageModel = require('../models/messageModel');
const { supabaseAdmin } = require('../config/db');
const { logger } = require('../middleware/loggerMiddleware');
const { sendEmail } = require('../services/emailService');

const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || 'https://rapiqr.worthitellp.workers.dev').replace(/\/+$/, '');

class AdminController {
  /**
   * Support console: list/search every user account with their sticker count.
   * GET /api/admin/users?search=
   */
  static async listUsers(req, res) {
    try {
      const { search } = req.query;
      const users = await UserModel.searchAll(search, 1000);

      const { data: counts } = await supabaseAdmin.from('products').select('user_id');
      const countMap = {};
      (counts || []).forEach((r) => {
        if (r.user_id) countMap[r.user_id] = (countMap[r.user_id] || 0) + 1;
      });

      const data = users.map((u) => ({ ...u, stickerCount: countMap[u.id] || 0 }));
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ADMIN_USERS_LIST', 'Failed to list users', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Support console: single user's profile + all their stickers.
   * GET /api/admin/users/:id
   */
  static async getUserDetail(req, res) {
    try {
      const { id } = req.params;
      const profile = await UserModel.findById(id);
      if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

      const products = await ProductModel.getAllByUser(id);
      return res.json({ success: true, data: { profile, products } });
    } catch (err) {
      logger.error('ADMIN_USER_DETAIL', `Failed to fetch user ${req.params.id}`, err);
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
      const data = await ProductModel.searchAll(search, 500);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('ADMIN_STICKER_SEARCH', 'Failed to search stickers', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Lost-access support: generate a Supabase password recovery link for a user
   * (e.g. they lost the phone with their authenticator app and can't sign in to
   * change anything themselves) and email it to them. If SMTP isn't configured,
   * the link is still returned so the admin can relay it through another channel.
   * POST /api/admin/users/:id/reset-password
   */
  static async triggerPasswordReset(req, res) {
    try {
      const { id } = req.params;
      const profile = await UserModel.findById(id);
      if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: profile.email,
        options: { redirectTo: `${FRONTEND_ORIGIN}/reset-password` },
      });
      if (error) return res.status(500).json({ success: false, error: error.message });

      const actionLink = data?.properties?.action_link || null;

      const emailResult = await sendEmail({
        to: profile.email,
        subject: 'RapiQR — Password Reset Requested by Support',
        html: `<p>Hi ${profile.full_name || ''},</p><p>Our support team triggered a password reset for your RapiQR account on your behalf. Click the link below to set a new password:</p><p><a href="${actionLink}">${actionLink}</a></p><p>If you did not contact support, you can ignore this email.</p>`,
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

      // 1. Unlink orders so FK constraints don't block user deletion
      try {
        await supabaseAdmin.from('orders').update({ user_id: null }).eq('user_id', id);
      } catch (orderErr) {
        logger.warn('ADMIN_USER_DELETE', `Orders update skipped for ${id}: ${orderErr.message}`);
      }

      // 2. Clean up chat messages and chat sessions owned by this user
      try {
        const { data: userSessions } = await supabaseAdmin
          .from('chat_sessions')
          .select('id')
          .eq('owner_id', id);

        if (userSessions && userSessions.length > 0) {
          const sessionIds = userSessions.map((s) => s.id);
          await supabaseAdmin.from('chat_messages').delete().in('session_id', sessionIds);
        }
        await supabaseAdmin.from('chat_sessions').delete().eq('owner_id', id);
      } catch (chatErr) {
        logger.warn('ADMIN_USER_DELETE', `Chat cleanup skipped for ${id}: ${chatErr.message}`);
      }

      // 3. Unlink QR codes
      try {
        await supabaseAdmin.from('qr_codes').update({ user_id: null }).eq('user_id', id);
      } catch (qrErr) {
        logger.warn('ADMIN_USER_DELETE', `QR codes unlink skipped for ${id}: ${qrErr.message}`);
      }

      // 4. Unlink or delete products owned by this user
      try {
        await supabaseAdmin.from('products').update({ user_id: null, assigned_to: 'Unassigned' }).eq('user_id', id);
      } catch (productErr) {
        logger.warn('ADMIN_USER_DELETE', `Products update skipped for ${id}: ${productErr.message}`);
      }

      // 5. Unlink distributor applications
      try {
        await supabaseAdmin.from('distributor_applications').update({ user_id: null }).eq('user_id', id);
      } catch (distErr) {
        logger.warn('ADMIN_USER_DELETE', `Distributor applications update skipped for ${id}: ${distErr.message}`);
      }

      // 6. Delete profile record from public.profiles
      try {
        const { error: profileErr } = await supabaseAdmin.from('profiles').delete().eq('id', id);
        if (profileErr) {
          logger.warn('ADMIN_USER_DELETE', `Profile delete warning for ${id}: ${profileErr.message}`);
        }
      } catch (profileErr) {
        logger.warn('ADMIN_USER_DELETE', `Profile delete skipped for ${id}: ${profileErr.message}`);
      }

      // 7. Delete auth user from Supabase Auth auth.users
      try {
        const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authErr) {
          logger.warn('ADMIN_USER_DELETE', `Auth delete warning for user ${id}: ${authErr.message}`);
        }
      } catch (authErr) {
        logger.warn('ADMIN_USER_DELETE', `Auth delete skipped for user ${id}: ${authErr.message}`);
      }

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
}

module.exports = AdminController;
