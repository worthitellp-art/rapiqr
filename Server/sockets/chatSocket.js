const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const ChatModel = require('../models/chatModel');
const ProductModel = require('../models/productModel');
const { notifyOwner } = require('../services/notificationService');
const pushService = require('../services/pushService');

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
 * Mirrors authMiddleware.verifyToken's JWT check for the owner side; the
 * customer side has no account at all, so it's authorized by possession of
 * the per-session customer_token minted in chatController.
 */
async function resolveIdentity(auth) {
  const { token, sessionId, customerToken } = auth || {};

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      return { type: 'owner', ownerId: decoded.id };
    } catch { /* invalid/expired token */ }
  }

  if (typeof sessionId === 'string' && sessionId && typeof customerToken === 'string' && customerToken) {
    const session = await ChatModel.getSessionById(sessionId);
    if (session && session.customer_token === customerToken) {
      return { type: 'customer', sessionId, customerToken };
    }
    // No matching session, or the token doesn't match its real one — reject.
    // (This used to fall through and return the "customer" identity anyway
    // regardless of whether the check above passed, which meant anyone who
    // could guess/see a sessionId could read and send messages in it with
    // any customerToken at all — the check was effectively a no-op.)
  }

  return null;
}

/**
 * True when this identity is allowed to read/write the given session.
 *
 * For an owner this can cost two lookups (session, then the product behind the
 * QR). `authorize` below memoizes the answer per socket so that price is paid
 * once per thread rather than on every typing ping — at one keystroke per event
 * the uncached version turned a fast connection into a queue of database round
 * trips, which is the opposite of what a typing indicator is for.
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

/**
 * Memoized access check, scoped to one socket connection.
 *
 * Only positive answers are cached. A denial stays un-cached so that a session
 * whose ownership is being resolved concurrently (an unclaimed sticker being
 * adopted by the account that just opened it) isn't locked out for the life of
 * the connection — and caching lives and dies with the socket, so revoked
 * access is at most one reconnect away.
 */
async function authorize(socket, sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) return false;
  if (!socket.allowedSessions) socket.allowedSessions = new Set();
  if (socket.allowedSessions.has(sessionId)) return true;

  const ok = await canAccessSession(socket.identity, sessionId);
  if (ok) socket.allowedSessions.add(sessionId);
  return ok;
}

/**
 * Turn the sender's single tick into a double one when the other side is
 * actually holding the thread open.
 *
 * "Delivered" here means a socket belonging to the peer is in the session room
 * at the moment of the broadcast — the honest meaning of the second tick, and
 * something we can answer locally without another database read. If nobody is
 * there the message simply stays on one tick until they open it, at which point
 * `mark_read` overtakes it with the read receipt anyway.
 */
async function markDeliveredIfPeerPresent(sessionId, message, senderType) {
  if (!io) return;
  try {
    const sockets = await io.in(`session:${sessionId}`).fetchSockets();
    const peerPresent = sockets.some((s) => s.data?.identityType !== senderType && s.data?.identityType);
    if (!peerPresent) return;

    const deliveredAt = await ChatModel.markDelivered(message.id);
    io.to(`session:${sessionId}`).emit('delivered', { sessionId, messageId: message.id, deliveredAt });
  } catch {
    /* presence is a nicety — never let it break a send */
  }
}

function initChatSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    // Let a client open on WebSocket directly instead of forcing the HTTP
    // long-poll handshake first and upgrading afterwards — that upgrade dance
    // costs a round trip on every connect, which is felt most on the mobile
    // connections this chat mostly runs on. Polling stays available for
    // networks that block WebSocket outright.
    transports: ['websocket', 'polling'],
    // A phone that walks out of signal should be noticed in seconds, not the
    // default ~45s, so the peer's "online" dot and typing state stay truthful.
    pingInterval: 20000,
    pingTimeout: 10000,
  });

  io.use(async (socket, next) => {
    const identity = await resolveIdentity(socket.handshake.auth);
    if (!identity) return next(new Error('Unauthorized'));
    socket.identity = identity;
    next();
  });

  io.on('connection', (socket) => {
    const room = (sessionId) => `session:${sessionId}`;

    // `data` is the part of a socket that fetchSockets() can see across the
    // adapter — markDeliveredIfPeerPresent reads it to tell the two sides apart.
    socket.data.identityType = socket.identity.type;

    if (socket.identity.type === 'owner') {
      markOwnerOnline(socket.identity.ownerId);
      socket.join(`owner:${socket.identity.ownerId}`);
      socket.on('disconnect', () => markOwnerOffline(socket.identity.ownerId));
    }

    socket.on('join_session', async (sessionId, ack) => {
      if (!(await authorize(socket, sessionId))) {
        return typeof ack === 'function' && ack({ success: false, error: 'Forbidden' });
      }
      socket.join(room(sessionId));
      typeof ack === 'function' && ack({ success: true });
    });

    socket.on('send_message', async ({ sessionId, body, clientId } = {}, ack) => {
      const text = String(body || '').trim();
      if (!sessionId || !text || !(await authorize(socket, sessionId))) {
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

      // The sender's own optimistic bubble is matched back by clientId rather
      // than by body text — two identical messages ("ok", "ok") are a normal
      // thing to send, and text matching collapsed them into one.
      const broadcast = clientId ? { ...message, client_id: clientId } : message;

      io.to(room(sessionId)).emit('new_message', broadcast);
      typeof ack === 'function' && ack({ success: true, message: broadcast });

      markDeliveredIfPeerPresent(sessionId, message, socket.identity.type);

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

        // If the customer sent it, notify the owner on WhatsApp and via Web
        // Push (the latter reaches them even with the dashboard tab closed).
        if (socket.identity.type === 'customer') {
          const label = session.vehicle_label || product?.name || 'your vehicle';
          if (product?.details?.ownerPhone) {
            notifyOwner({
              type: 'CHAT_MESSAGE',
              ownerPhone: product.details.ownerPhone,
              data: { label, message: text, link: `${APP_URL}/#/dashboard?tab=chat` },
              eventId: sessionId,
            }).catch(() => { /* best effort */ });
          }
          if (ownerId) {
            pushService.sendToUser(ownerId, {
              title: `New message about ${label}`,
              body: text,
              url: '/#/dashboard?tab=chat',
              tag: `chat-${sessionId}`,
            }).catch(() => { /* best effort */ });
          }
        }
      }).catch(() => { /* best effort */ });
    });

    socket.on('typing', async ({ sessionId, isTyping } = {}) => {
      if (!(await authorize(socket, sessionId))) return;
      socket.to(room(sessionId)).emit('typing', { sessionId, isTyping: Boolean(isTyping), from: socket.identity.type });
    });

    socket.on('mark_read', async ({ sessionId } = {}) => {
      if (!(await authorize(socket, sessionId))) return;
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

module.exports = { initChatSocket, getIo, getOnlineOwners, markDeliveredIfPeerPresent };
