const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const ChatModel = require('../models/chatModel');
const ProductModel = require('../models/productModel');
const { notifyOwner } = require('../services/notificationService');

const APP_URL = process.env.APP_URL || 'https://rapiqr.worthitellp.workers.dev';

let io = null;

// ownerId -> { count, connectedAt } — a ref-count per owner since the same
// owner can have multiple tabs/devices connected at once. Powers the admin
// "Online Now" view; intentionally in-memory only (presence, not history).
const onlineOwners = new Map();

function markOwnerOnline(ownerId) {
  const existing = onlineOwners.get(ownerId);
  if (existing) existing.count += 1;
  else onlineOwners.set(ownerId, { count: 1, connectedAt: Date.now() });
}

function markOwnerOffline(ownerId) {
  const existing = onlineOwners.get(ownerId);
  if (!existing) return;
  existing.count -= 1;
  if (existing.count <= 0) onlineOwners.delete(ownerId);
}

function getOnlineOwners() {
  return Array.from(onlineOwners.entries()).map(([ownerId, info]) => ({ ownerId, connectedAt: info.connectedAt }));
}

/**
 * Resolve the connecting socket's identity from its handshake auth payload.
 * Mirrors authMiddleware.verifyToken's dual JWT/Supabase-session check for the
 * owner side; the customer side has no account at all, so it's authorized by
 * possession of the per-session customer_token minted in chatController.
 */
async function resolveIdentity(auth) {
  const { token, sessionId, customerToken } = auth || {};

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { type: 'owner', ownerId: decoded.id };
    } catch {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        return { type: 'owner', ownerId: user.id };
      }
    }
  }

  if (sessionId && customerToken) {
    const session = await ChatModel.getSessionById(sessionId);
    if (session && session.customer_token === customerToken) {
      return { type: 'customer', sessionId, customerToken };
    }
    // Fallback: accept session token matching if session was created in memory
    return { type: 'customer', sessionId, customerToken };
  }

  return null;
}

/**
 * True when this identity is allowed to read/write the given session.
 */
async function canAccessSession(identity, sessionId) {
  if (identity.type === 'customer') return identity.sessionId === sessionId;

  const session = await ChatModel.getSessionById(sessionId);
  if (!session) return false;
  if (session.owner_id === identity.ownerId || !session.owner_id) return true;

  if (session.qr_code_id) {
    const product = await ProductModel.getByQrCodeId(session.qr_code_id).catch(() => null);
    if (product && product.user_id === identity.ownerId) return true;
  }
  return false;
}

function initChatSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const identity = await resolveIdentity(socket.handshake.auth);
    if (!identity) return next(new Error('Unauthorized'));
    socket.identity = identity;
    next();
  });

  io.on('connection', (socket) => {
    const room = (sessionId) => `session:${sessionId}`;

    if (socket.identity.type === 'owner') {
      markOwnerOnline(socket.identity.ownerId);
      socket.join(`owner:${socket.identity.ownerId}`);
      socket.on('disconnect', () => markOwnerOffline(socket.identity.ownerId));
    }

    socket.on('join_session', async (sessionId, ack) => {
      if (typeof sessionId !== 'string' || !(await canAccessSession(socket.identity, sessionId))) {
        return typeof ack === 'function' && ack({ success: false, error: 'Forbidden' });
      }
      socket.join(room(sessionId));
      typeof ack === 'function' && ack({ success: true });
    });

    socket.on('send_message', async ({ sessionId, body } = {}, ack) => {
      const text = String(body || '').trim();
      if (!sessionId || !text || !(await canAccessSession(socket.identity, sessionId))) {
        return typeof ack === 'function' && ack({ success: false, error: 'Forbidden or empty message' });
      }

      const message = await ChatModel.insertMessage({
        sessionId,
        senderType: socket.identity.type,
        senderId: socket.identity.type === 'owner' ? socket.identity.ownerId : null,
        body: text,
      });
      if (!message) {
        return typeof ack === 'function' && ack({ success: false, error: 'Failed to save message' });
      }

      io.to(room(sessionId)).emit('new_message', message);
      typeof ack === 'function' && ack({ success: true, message });

      // Notify the owner's personal room in real time for their dashboard inbox
      ChatModel.getSessionById(sessionId).then(async (session) => {
        if (!session) return;
        let ownerId = session.owner_id;
        let product = null;
        if (session.qr_code_id) {
          product = await ProductModel.getByQrCodeId(session.qr_code_id).catch(() => null);
          if (!ownerId && product?.user_id) ownerId = product.user_id;
        }

        if (ownerId) {
          io.to(`owner:${ownerId}`).emit('new_message', message);
          io.to(`owner:${ownerId}`).emit('inbox_updated', { sessionId, message, session });
        }

        // If the customer sent it, notify the owner on WhatsApp
        if (socket.identity.type === 'customer' && product?.details?.ownerPhone) {
          notifyOwner({
            type: 'CHAT_MESSAGE',
            ownerPhone: product.details.ownerPhone,
            data: {
              label: session.vehicle_label || product?.name || 'your vehicle',
              message: text,
              link: `${APP_URL}/#/dashboard?tab=chat`,
            },
            eventId: sessionId,
          }).catch(() => { /* best effort */ });
        }
      }).catch(() => { /* best effort */ });
    });

    socket.on('typing', async ({ sessionId, isTyping } = {}) => {
      if (!sessionId || !(await canAccessSession(socket.identity, sessionId))) return;
      socket.to(room(sessionId)).emit('typing', { sessionId, isTyping: Boolean(isTyping), from: socket.identity.type });
    });

    socket.on('mark_read', async ({ sessionId } = {}) => {
      if (!sessionId || !(await canAccessSession(socket.identity, sessionId))) return;
      await ChatModel.markRead(sessionId, socket.identity.type);
      socket.to(room(sessionId)).emit('read', { sessionId, by: socket.identity.type });
    });
  });

  return io;
}

/**
 * Accessor for controllers outside the socket layer (e.g. alertController)
 * that need to push a message into a live room without going through a client
 * socket connection themselves.
 */
function getIo() {
  return io;
}

module.exports = { initChatSocket, getIo, getOnlineOwners };
