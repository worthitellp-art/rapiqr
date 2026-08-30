const crypto = require('crypto');
const ChatModel = require('../models/chatModel');
const ChatSession = require('../models/schemas/ChatSession');
const User = require('../models/schemas/User');
const ProductModel = require('../models/productModel');
const { uploadPublicFile } = require('../services/storageService');
const { notifyOwner } = require('../services/notificationService');
const pushService = require('../services/pushService');
const { logger } = require('../middleware/loggerMiddleware');
const { getIo, getOnlineOwners, markDeliveredIfPeerPresent } = require('../sockets/chatSocket');

const APP_URL = process.env.APP_URL || 'https://rapiqr.worthitellp.workers.dev';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
/** Post-compression ceiling. The client downscales before upload; this is the backstop. */
const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024;

async function isOwnerOfSession(req, session) {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  if (session.owner_id && req.user.id === session.owner_id) return true;

  if (session.qr_code_id) {
    const product = await ProductModel.getByQrCodeId(session.qr_code_id).catch(() => null);
    if (product && product.user_id === req.user.id) {
      if (!session.owner_id) {
        ChatSession.findByIdAndUpdate(session.id, { $set: { owner_id: req.user.id } }).catch(() => { /* best effort */ });
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

/**
 * Push a freshly-saved message everywhere it needs to go: the live session room,
 * the owner's inbox room, and — when a visitor sent it — the owner's phone.
 * Shared by the REST send and the attachment upload so the two can't drift.
 */
async function fanOutMessage(session, message, isOwner, previewText) {
  const io = getIo();
  io?.to(`session:${session.id}`).emit('new_message', message);

  let ownerId = session.owner_id;
  let product = null;
  if (session.qr_code_id) {
    product = await ProductModel.getByQrCodeId(session.qr_code_id).catch(() => null);
    if (!ownerId && product?.user_id) ownerId = product.user_id;
  }
  if (ownerId) {
    io?.to(`owner:${ownerId}`).emit('new_message', message);
    io?.to(`owner:${ownerId}`).emit('inbox_updated', { sessionId: session.id, message, session });
  }

  markDeliveredIfPeerPresent(session.id, message, isOwner ? 'owner' : 'customer');

  if (!isOwner) {
    const label = session.vehicle_label || product?.name || 'your vehicle';
    if (product?.details?.ownerPhone) {
      notifyOwner({
        type: 'CHAT_MESSAGE',
        ownerPhone: product.details.ownerPhone,
        data: { label, message: previewText, link: `${APP_URL}/#/dashboard?tab=chat` },
        eventId: session.id,
      }).catch((err) => logger.error('CHAT_MESSAGE', 'Failed to notify owner', err));
    }
    // Web Push reaches the owner even with the dashboard tab closed, unlike
    // the socket emit above (only delivered to an open connection) — doesn't
    // need a phone number, just a subscribed device.
    if (ownerId) {
      pushService.sendToUser(ownerId, {
        title: `New message about ${label}`,
        body: previewText,
        url: '/#/dashboard?tab=chat',
        tag: `chat-${session.id}`,
      }).catch((err) => logger.error('CHAT_MESSAGE', 'Failed to push-notify owner', err));
    }
  }
}

class ChatController {
  /**
   * POST /api/chat/sessions/:id/attachments — send an image into a thread.
   *
   * Takes a base64 data URL rather than multipart: the client already has the
   * image in a canvas to downscale it, so it hands over exactly the bytes it
   * produced, and the server needs no upload middleware. The client compresses
   * first; MAX_ATTACHMENT_BYTES is the backstop for anything that didn't.
   */
  static async sendAttachment(req, res) {
    try {
      const session = await ChatModel.getSessionById(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      const isOwner = await isOwnerOfSession(req, session);
      if (!isOwner && !isCustomerOfSession(req, session)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const { image, name, width, height, caption, clientId } = req.body || {};
      if (!image) return res.status(400).json({ success: false, error: 'image (base64 data URL) is required' });

      const mimeMatch = String(image).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return res.status(400).json({ success: false, error: `Unsupported image type: ${contentType}` });
      }

      const buffer = Buffer.from(mimeMatch ? String(image).split(',')[1] : String(image), 'base64');
      if (!buffer.length) return res.status(400).json({ success: false, error: 'The image data was empty or malformed.' });
      if (buffer.length > MAX_ATTACHMENT_BYTES) {
        return res.status(413).json({
          success: false,
          error: `That image is ${(buffer.length / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.`,
        });
      }

      const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      // Random filename, not the user's: an uploader must not be able to pick a
      // path in a public bucket, and two people sending "photo.jpg" must not collide.
      const path = `chat-uploads/${session.id}/${crypto.randomUUID()}.${ext}`;

      const publicUrl = await uploadPublicFile(path, buffer, contentType);

      const message = await ChatModel.insertMessage({
        sessionId: session.id,
        senderType: isOwner ? 'owner' : 'customer',
        senderId: isOwner ? req.user.id : null,
        body: String(caption || '').trim(),
        attachment: {
          url: publicUrl,
          type: contentType,
          name: String(name || '').slice(0, 120) || `image.${ext}`,
          width: Number(width) || null,
          height: Number(height) || null,
        },
      });
      if (!message) return res.status(500).json({ success: false, error: 'Failed to save the image message' });

      // Carry the sender's temporary id on the broadcast. Their own socket
      // receives the fan-out before this HTTP response returns, and without an
      // id to match on, the pending bubble and the broadcast are two different
      // messages as far as the client can tell — the photo appeared twice.
      const broadcast = clientId ? { ...message, client_id: clientId } : message;
      await fanOutMessage(session, broadcast, isOwner, caption ? `📷 ${caption}` : '📷 Photo');

      logger.event('CHAT', '📷', `Image sent in session ${session.id} (${(buffer.length / 1024).toFixed(0)} KB)`);
      return res.json({ success: true, data: broadcast });
    } catch (err) {
      logger.error('CHAT_ATTACHMENT', 'Failed to send chat image', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Start (or resume) the open RepiChat thread for a scanned QR code. The
   * scanning visitor has no account, so they're identified purely by an opaque
   * customerToken their browser holds in localStorage per QR id.
   */
  static async startSession(req, res) {
    try {
      const { qrId: rawQrId, customerToken: rawIncomingToken, customerName: rawCustomerName } = req.body || {};
      if (!rawQrId) return res.status(400).json({ success: false, error: 'qrId is required' });

      // Cast every client-supplied value to a plain string before it can reach
      // a Mongo query — otherwise a body like {"qrId": {"$ne": null}} lets an
      // unauthenticated caller match an arbitrary existing chat session instead
      // of a specific sticker's.
      const qrId = String(rawQrId);
      const customerName = rawCustomerName !== undefined ? String(rawCustomerName) : undefined;

      const product = await ProductModel.getByQrCodeId(qrId).catch(() => null);
      const ownerId = product?.user_id || null;
      const vehicleLabel = product
        ? `${product.name || 'Vehicle'}${product.vehicle_number ? ` (${product.vehicle_number})` : ''}`
        : null;

      const customerToken = rawIncomingToken ? String(rawIncomingToken) : crypto.randomUUID();
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

      // Same echo as the socket path — see sendAttachment.
      const clientId = req.body?.clientId;
      const broadcast = clientId ? { ...message, client_id: clientId } : message;
      await fanOutMessage(session, broadcast, isOwner, text);

      return res.json({ success: true, data: broadcast });
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
      const profiles = await User.find({ _id: { $in: ids } }).select('full_name email').lean();

      const profileById = new Map(profiles.map((p) => [String(p._id), p]));
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
