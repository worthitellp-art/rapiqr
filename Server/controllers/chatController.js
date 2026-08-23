const crypto = require('crypto');
const ChatModel = require('../models/chatModel');
const ProductModel = require('../models/productModel');
const { supabaseAdmin } = require('../config/db');
const { notifyOwner } = require('../services/notificationService');
const { logger } = require('../middleware/loggerMiddleware');
const { getIo, getOnlineOwners } = require('../sockets/chatSocket');

const APP_URL = process.env.APP_URL || 'https://rapiqr.worthitellp.workers.dev';

async function isOwnerOfSession(req, session) {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  if (session.owner_id && req.user.id === session.owner_id) return true;

  if (session.qr_code_id) {
    const product = await ProductModel.getByQrCodeId(session.qr_code_id).catch(() => null);
    if (product && product.user_id === req.user.id) {
      if (!session.owner_id) {
        supabaseAdmin.from('chat_sessions').update({ owner_id: req.user.id }).eq('id', session.id).then();
        session.owner_id = req.user.id;
      }
      return true;
    }
  }
  return false;
}

function isCustomerOfSession(req, session) {
  const headerToken = req.headers['x-customer-token'];
  return Boolean(headerToken && headerToken === session.customer_token);
}

class ChatController {
  /**
   * Start (or resume) the open RepiChat thread for a scanned QR code. The
   * scanning visitor has no account, so they're identified purely by an opaque
   * customerToken their browser holds in localStorage per QR id.
   */
  static async startSession(req, res) {
    try {
      const { qrId, customerToken: incomingToken, customerName } = req.body || {};
      if (!qrId) return res.status(400).json({ success: false, error: 'qrId is required' });

      const product = await ProductModel.getByQrCodeId(qrId).catch(() => null);
      const ownerId = product?.user_id || null;
      const vehicleLabel = product
        ? `${product.name || 'Vehicle'}${product.vehicle_number ? ` (${product.vehicle_number})` : ''}`
        : null;

      const customerToken = incomingToken || crypto.randomUUID();
      const { session, isNew } = await ChatModel.findOrCreateOpenSession({
        qrCodeId: qrId,
        customerToken,
        customerName: customerName || 'Visitor',
        ownerId,
        vehicleLabel,
      });

      if (!session) return res.status(500).json({ success: false, error: 'Could not start chat session' });

      // Notify the owner's dashboard live inbox in real time
      if (ownerId) {
        getIo()?.to(`owner:${ownerId}`).emit('inbox_updated', { sessionId: session.id, session, isNew });
      }

      // First time this visitor opens the thread — notify the owner on WhatsApp so
      // they know a chat is waiting, with a link straight into the dashboard inbox.
      // Best-effort: never block/fail the visitor's chat over a notify hiccup.
      const ownerPhone = product?.details?.ownerPhone;
      if (isNew && ownerPhone) {
        notifyOwner({
          type: 'CHAT_STARTED',
          ownerPhone,
          data: { label: vehicleLabel || 'your RapiQR item', link: `${APP_URL}/#/dashboard?tab=chat` },
          eventId: session.id,
        }).catch((err) => logger.error('CHAT_STARTED', 'Failed to notify owner of new chat', err));
      }

      return res.json({
        success: true,
        sessionId: session.id,
        customerToken,
        ownerName: product?.assigned_to || product?.name || 'Vehicle Owner',
        hasOwner: Boolean(ownerId),
      });
    } catch (err) {
      logger.error('CHAT_START', 'Failed to start chat session', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getMessages(req, res) {
    try {
      const session = await ChatModel.getSessionById(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      const isOwner = await isOwnerOfSession(req, session);
      const isCustomer = isCustomerOfSession(req, session);
      if (!isOwner && !isCustomer) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const messages = await ChatModel.listMessages(session.id);
      return res.json({ success: true, data: messages, session });
    } catch (err) {
      logger.error('CHAT_MESSAGES', 'Failed to fetch chat messages', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * REST fallback for sending a message when the socket hasn't connected yet
   * (e.g. the very first message from a quick-issue tile). Also broadcasts to
   * the live socket room so anyone already connected sees it instantly.
   */
  static async sendMessageRest(req, res) {
    try {
      const session = await ChatModel.getSessionById(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const isOwner = await isOwnerOfSession(req, session);
      if (!isOwner && !isCustomerOfSession(req, session)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const text = String(req.body?.body || '').trim();
      if (!text) return res.status(400).json({ success: false, error: 'Message body is required' });

      const message = await ChatModel.insertMessage({
        sessionId: session.id,
        senderType: isOwner ? 'owner' : 'customer',
        senderId: isOwner ? req.user.id : null,
        body: text,
      });
      if (!message) return res.status(500).json({ success: false, error: 'Failed to save message' });

      getIo()?.to(`session:${session.id}`).emit('new_message', message);

      let ownerId = session.owner_id;
      let product = null;
      if (session.qr_code_id) {
        product = await ProductModel.getByQrCodeId(session.qr_code_id).catch(() => null);
        if (!ownerId && product?.user_id) ownerId = product.user_id;
      }
      if (ownerId) {
        getIo()?.to(`owner:${ownerId}`).emit('new_message', message);
        getIo()?.to(`owner:${ownerId}`).emit('inbox_updated', { sessionId: session.id, message, session });
      }

      // If the customer sent it, notify the owner on WhatsApp with the direct link
      if (!isOwner && product?.details?.ownerPhone) {
        const ownerPhone = product.details.ownerPhone;
        const label = session.vehicle_label || product?.name || 'your vehicle';
        notifyOwner({
          type: 'CHAT_MESSAGE',
          ownerPhone,
          data: {
            label,
            message: text,
            link: `${APP_URL}/#/dashboard?tab=chat`,
          },
          eventId: session.id,
        }).catch((err) => logger.error('CHAT_MESSAGE', 'Failed to notify owner', err));
      }

      return res.json({ success: true, data: message });
    } catch (err) {
      logger.error('CHAT_SEND', 'Failed to send chat message', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async listOwnerSessions(req, res) {
    try {
      const sessions = await ChatModel.listSessionsForOwner(req.user.id);
      return res.json({ success: true, data: sessions });
    } catch (err) {
      logger.error('CHAT_INBOX', 'Failed to list owner chat sessions', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async markRead(req, res) {
    try {
      const session = await ChatModel.getSessionById(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const isOwner = await isOwnerOfSession(req, session);
      if (!isOwner && !isCustomerOfSession(req, session)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      await ChatModel.markRead(session.id, isOwner ? 'owner' : 'customer');
      getIo()?.to(`session:${session.id}`).emit('read', { sessionId: session.id, by: isOwner ? 'owner' : 'customer' });
      return res.json({ success: true });
    } catch (err) {
      logger.error('CHAT_READ', 'Failed to mark chat session read', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Admin-only "Online Now" view — who's currently connected, not what
   * they're saying. Replaces a full chat inbox for the system admin, who
   * doesn't run per-sticker conversations themselves.
   */
  static async listOnlineOwners(req, res) {
    try {
      const online = getOnlineOwners();
      if (online.length === 0) return res.json({ success: true, data: [] });

      const ids = online.map((o) => o.ownerId);
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', ids);
      if (error) throw error;

      const profileById = new Map((profiles || []).map((p) => [p.id, p]));
      const data = online.map((o) => ({
        ownerId: o.ownerId,
        connectedAt: new Date(o.connectedAt).toISOString(),
        fullName: profileById.get(o.ownerId)?.full_name || 'Unknown user',
        email: profileById.get(o.ownerId)?.email || null,
      }));

      return res.json({ success: true, data });
    } catch (err) {
      logger.error('CHAT_ONLINE', 'Failed to list online owners', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async closeSession(req, res) {
    try {
      const session = await ChatModel.getSessionById(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      const isOwner = await isOwnerOfSession(req, session);
      if (!isOwner) return res.status(403).json({ success: false, error: 'Forbidden' });

      const updated = await ChatModel.closeSession(session.id);
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('CHAT_CLOSE', 'Failed to close chat session', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteSession(req, res) {
    try {
      const session = await ChatModel.getSessionById(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
      const isOwner = await isOwnerOfSession(req, session);
      if (!isOwner) return res.status(403).json({ success: false, error: 'Forbidden' });

      await ChatModel.deleteSession(session.id);
      getIo()?.to(`session:${session.id}`).emit('session_deleted', { sessionId: session.id });
      getIo()?.to(`owner:${req.user.id}`).emit('inbox_updated', { sessionId: session.id, deleted: true });
      return res.json({ success: true, message: 'Chat session deleted' });
    } catch (err) {
      logger.error('CHAT_DELETE', 'Failed to delete chat session', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = ChatController;
