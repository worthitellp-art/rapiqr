const ChatSession = require('./schemas/ChatSession');
const ChatMessage = require('./schemas/ChatMessage');
const Sticker = require('./schemas/Sticker');

function sessionToApi(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    qr_code_id: doc.qr_code_id,
    owner_id: doc.owner_id ? String(doc.owner_id) : null,
    customer_token: doc.customer_token,
    customer_name: doc.customer_name,
    vehicle_label: doc.vehicle_label,
    status: doc.status,
    last_message_at: doc.last_message_at,
    last_message_preview: doc.last_message_preview,
    unread_owner_count: doc.unread_owner_count,
    unread_customer_count: doc.unread_customer_count,
    created_at: doc.created_at,
  };
}

function messageToApi(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    session_id: String(doc.session_id),
    sender_type: doc.sender_type,
    sender_id: doc.sender_id ? String(doc.sender_id) : null,
    body: doc.body,
    created_at: doc.created_at,
    read_at: doc.read_at,
    delivered_at: doc.delivered_at,
    attachment_url: doc.attachment_url,
    attachment_type: doc.attachment_type,
    attachment_name: doc.attachment_name,
    attachment_width: doc.attachment_width,
    attachment_height: doc.attachment_height,
  };
}

class ChatModel {
  /**
   * Reuse the still-open session for this (qrCodeId, customerToken) pair if
   * one exists, otherwise create a fresh one.
   */
  static async findOrCreateOpenSession({ qrCodeId, customerToken, customerName, ownerId, vehicleLabel }) {
    // Callers reach this from multiple public, unauthenticated routes
    // (chat start, alert dispatch) with request-body values — cast to plain
    // strings before they can reach a query filter, otherwise a value like
    // {"$ne": null} matches an arbitrary existing open session instead of
    // this specific (sticker, visitor) pair.
    if (typeof qrCodeId !== 'string' && typeof qrCodeId !== 'number') throw new Error('qrCodeId must be a string');
    if (typeof customerToken !== 'string' && typeof customerToken !== 'number') throw new Error('customerToken must be a string');
    qrCodeId = String(qrCodeId);
    customerToken = String(customerToken);

    try {
      const existing = await ChatSession.findOne({ qr_code_id: qrCodeId, customer_token: customerToken, status: 'open' }).lean();
      if (existing) return { session: sessionToApi(existing), isNew: false };

      const created = await ChatSession.create({
        qr_code_id: qrCodeId,
        owner_id: ownerId || null,
        customer_token: customerToken,
        customer_name: customerName ? String(customerName) : 'Visitor',
        vehicle_label: vehicleLabel || null,
      });
      return { session: sessionToApi(created), isNew: true };
    } catch (err) {
      console.error('ChatModel.findOrCreateOpenSession Error:', err);
      throw err;
    }
  }

  static async getSessionById(sessionId) {
    try {
      if (typeof sessionId !== 'string' && typeof sessionId !== 'number') return null;
      const cleanId = String(sessionId).trim();
      if (!cleanId) return null;

      const isObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);
      let doc = null;
      if (isObjectId) {
        doc = await ChatSession.findById(cleanId).lean().catch(() => null);
      }
      if (!doc) {
        doc = await ChatSession.findOne({ _id: cleanId }).lean().catch(() => null);
      }
      return sessionToApi(doc);
    } catch (err) {
      console.error(`ChatModel.getSessionById (${sessionId}) Error:`, err);
      return null;
    }
  }

  static async listSessionsForOwner(ownerId) {
    try {
      // Sessions can be linked either directly (owner_id) or via the sticker
      // they were opened against (qr_code_id) — a sticker claimed after the
      // conversation started still needs to show up in the new owner's inbox.
      const ownedStickers = await Sticker.find({ user_id: ownerId }).select('_id').lean();
      const ownedQrIds = ownedStickers.map((s) => s._id);

      const filter = ownedQrIds.length > 0
        ? { $or: [{ owner_id: ownerId }, { qr_code_id: { $in: ownedQrIds } }] }
        : { owner_id: ownerId };

      const docs = await ChatSession.find(filter)
        .sort({ last_message_at: -1, created_at: -1 })
        .lean();
      return docs.map(sessionToApi);
    } catch (err) {
      console.error(`ChatModel.listSessionsForOwner (${ownerId}) Error:`, err);
      return [];
    }
  }

  static async listMessages(sessionId) {
    try {
      const docs = await ChatMessage.find({ session_id: sessionId }).sort({ created_at: 1 }).lean();
      return docs.map(messageToApi);
    } catch (err) {
      console.error(`ChatModel.listMessages (${sessionId}) Error:`, err);
      return [];
    }
  }

  /**
   * Insert a message and bump the parent session's preview/unread counters.
   * `attachment` is optional: { url, type, name, width, height }.
   *
   * Only the message insert is awaited — the session counter bump is a
   * second round-trip nothing on the sending path is waiting to read, and the
   * caller broadcasts as soon as this resolves.
   */
  static async insertMessage({ sessionId, senderType, senderId, body, attachment = null }) {
    const bumpUnreadKey = senderType === 'owner' ? 'unread_customer_count' : 'unread_owner_count';
    const preview = attachment ? (body ? `📷 ${body}` : '📷 Photo') : String(body).slice(0, 140);

    const payload = {
      session_id: sessionId,
      sender_type: senderType,
      sender_id: senderId || null,
      body,
    };
    if (attachment) {
      payload.attachment_url = attachment.url;
      payload.attachment_type = attachment.type || null;
      payload.attachment_name = attachment.name || null;
      payload.attachment_width = attachment.width || null;
      payload.attachment_height = attachment.height || null;
    }

    const message = await ChatMessage.create(payload);

    ChatSession.findByIdAndUpdate(sessionId, {
      $set: { last_message_at: message.created_at, last_message_preview: preview },
      $inc: { [bumpUnreadKey]: 1 },
    }).catch((err) => console.warn('ChatModel.insertMessage session bump warning:', err.message));

    return messageToApi(message);
  }

  /** Second tick: the recipient's socket was in the room when this was broadcast. */
  static async markDelivered(messageId) {
    const at = new Date();
    ChatMessage.findByIdAndUpdate(messageId, { $set: { delivered_at: at } })
      .catch((err) => console.warn('ChatModel.markDelivered warning:', err.message));
    return at;
  }

  static async markRead(sessionId, readerType) {
    try {
      const unreadKey = readerType === 'owner' ? 'unread_owner_count' : 'unread_customer_count';
      // Whoever is reading, it's the OTHER side's messages that just became read —
      // the double tick renders on the sender's own bubbles.
      const peerType = readerType === 'owner' ? 'customer' : 'owner';
      const readAt = new Date();

      await ChatSession.findByIdAndUpdate(sessionId, { $set: { [unreadKey]: 0 } });

      // Without this the read tick only ever existed as a live socket event:
      // it looked right until either side reloaded, then every message the peer
      // had already read came back showing a single "sent" tick forever.
      await ChatMessage.updateMany(
        { session_id: sessionId, sender_type: peerType, read_at: null },
        { $set: { read_at: readAt } }
      );

      return true;
    } catch (err) {
      console.error(`ChatModel.markRead (${sessionId}) Error:`, err);
      return false;
    }
  }

  static async closeSession(sessionId) {
    try {
      const doc = await ChatSession.findByIdAndUpdate(sessionId, { $set: { status: 'closed' } }, { new: true }).lean();
      return sessionToApi(doc);
    } catch (err) {
      console.error(`ChatModel.closeSession (${sessionId}) Error:`, err);
      return null;
    }
  }

  static async deleteSession(sessionId) {
    try {
      await ChatMessage.deleteMany({ session_id: sessionId });
      await ChatSession.findByIdAndDelete(sessionId);
    } catch (err) {
      console.error(`ChatModel.deleteSession (${sessionId}) Error:`, err);
    }
    return true;
  }
}

module.exports = ChatModel;
