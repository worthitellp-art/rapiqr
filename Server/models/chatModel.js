const { supabaseAdmin } = require('../config/db');

const SESSION_SELECT = 'id, qr_code_id, owner_id, customer_token, customer_name, vehicle_label, status, last_message_at, last_message_preview, unread_owner_count, unread_customer_count, created_at';

const MESSAGE_BASE = 'id, session_id, sender_type, sender_id, body, created_at, read_at';
const MESSAGE_RICH = `${MESSAGE_BASE}, delivered_at, attachment_url, attachment_type, attachment_name, attachment_width, attachment_height`;

/**
 * Whether Server/sql/chat_attachments.sql has been run against this database.
 *
 * Probed once on the first message read and remembered, so an un-migrated
 * deployment pays a single failed query rather than one per request. Until it
 * runs, images still work — insertMessage carries the URL in `body` instead,
 * and the client renders a bare image URL as a picture regardless.
 */
let richColumns = null;

async function messageSelect() {
  if (richColumns !== null) return richColumns ? MESSAGE_RICH : MESSAGE_BASE;

  const { error } = await supabaseAdmin.from('chat_messages').select(MESSAGE_RICH).limit(1);
  richColumns = !error;
  if (!richColumns) {
    console.warn('ChatModel: chat_messages is missing the attachment columns — run Server/sql/chat_attachments.sql for image metadata. Images still work via the message body until then.');
  }
  return richColumns ? MESSAGE_RICH : MESSAGE_BASE;
}

// In-memory fallback stores to guarantee zero chat downtime if database constraints or network lag occur
const inMemorySessions = new Map(); // sessionId -> session object
const inMemoryMessages = new Map(); // sessionId -> array of message objects

class ChatModel {
  /**
   * Reuse the still-open session for this (qrCodeId, customerToken) pair if one
   * exists, otherwise create a fresh one.
   */
  static async findOrCreateOpenSession({ qrCodeId, customerToken, customerName, ownerId, vehicleLabel }) {
    // Check in-memory store first
    for (const sess of inMemorySessions.values()) {
      if (sess.qr_code_id === qrCodeId && sess.customer_token === customerToken && sess.status === 'open') {
        return { session: sess, isNew: false };
      }
    }

    try {
      const { data: existing, error: findError } = await supabaseAdmin
        .from('chat_sessions')
        .select(SESSION_SELECT)
        .eq('qr_code_id', qrCodeId)
        .eq('customer_token', customerToken)
        .eq('status', 'open')
        .maybeSingle();

      if (!findError && existing) {
        inMemorySessions.set(existing.id, existing);
        return { session: existing, isNew: false };
      }

      // Ensure qr_codes table has the qr_code_id to satisfy foreign key constraint
      try {
        const { data: qrRow } = await supabaseAdmin
          .from('qr_codes')
          .select('id')
          .eq('id', qrCodeId)
          .maybeSingle();
        if (!qrRow) {
          await supabaseAdmin.from('qr_codes').upsert({
            id: qrCodeId,
            client_id: 'UNASSIGNED',
            status: 'active',
            category: 'car',
            created_at: new Date().toISOString()
          }, { onConflict: 'id' });
        }
      } catch (qrErr) {
        console.warn('ChatModel: QR existence check failed (continuing):', qrErr.message);
      }

      const newSessionPayload = {
        qr_code_id: qrCodeId,
        owner_id: ownerId || null,
        customer_token: customerToken,
        customer_name: customerName || 'Visitor',
        vehicle_label: vehicleLabel || null,
      };

      const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .insert(newSessionPayload)
        .select(SESSION_SELECT)
        .maybeSingle();

      if (!error && data) {
        inMemorySessions.set(data.id, data);
        return { session: data, isNew: true };
      }

      if (error) {
        console.warn('ChatModel.findOrCreateOpenSession DB insert warning:', error.message);
      }
    } catch (err) {
      console.warn('ChatModel.findOrCreateOpenSession Error (using resilient fallback):', err.message);
    }

    // Fallback in-memory session so chat always starts seamlessly
    const fallbackId = `sess_${qrCodeId.replace(/[^a-zA-Z0-9]/g, '')}_${customerToken.slice(0, 8)}`;
    const fallbackSession = {
      id: fallbackId,
      qr_code_id: qrCodeId,
      owner_id: ownerId || null,
      customer_token: customerToken,
      customer_name: customerName || 'Visitor',
      vehicle_label: vehicleLabel || null,
      status: 'open',
      last_message_at: new Date().toISOString(),
      last_message_preview: null,
      unread_owner_count: 0,
      unread_customer_count: 0,
      created_at: new Date().toISOString(),
    };

    inMemorySessions.set(fallbackId, fallbackSession);
    return { session: fallbackSession, isNew: true };
  }

  static async getSessionById(sessionId) {
    if (inMemorySessions.has(sessionId)) {
      return inMemorySessions.get(sessionId);
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .select(SESSION_SELECT)
        .eq('id', sessionId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        inMemorySessions.set(data.id, data);
        return data;
      }
      return null;
    } catch (err) {
      console.error(`ChatModel.getSessionById (${sessionId}) Error:`, err.message);
      return inMemorySessions.get(sessionId) || null;
    }
  }

  static async listSessionsForOwner(ownerId) {
    let dbSessions = [];
    try {
      // Find all products owned by this owner to also match sessions linked via qr_code_id
      let ownedQrIds = [];
      try {
        const { data: products } = await supabaseAdmin
          .from('products')
          .select('qr_code_id')
          .eq('user_id', ownerId);
        if (products && products.length > 0) {
          ownedQrIds = products.map((p) => p.qr_code_id).filter(Boolean);
        }
      } catch { /* ignore */ }

      let query = supabaseAdmin
        .from('chat_sessions')
        .select(SESSION_SELECT);

      if (ownedQrIds.length > 0) {
        query = query.or(`owner_id.eq.${ownerId},qr_code_id.in.(${ownedQrIds.join(',')})`);
      } else {
        query = query.eq('owner_id', ownerId);
      }

      const { data, error } = await query
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbSessions = data;
      }
    } catch (err) {
      console.error(`ChatModel.listSessionsForOwner (${ownerId}) Error:`, err.message);
    }

    // Merge in-memory sessions that match this owner
    const sessionMap = new Map();
    for (const s of dbSessions) {
      sessionMap.set(s.id, s);
      inMemorySessions.set(s.id, s);
    }
    for (const s of inMemorySessions.values()) {
      if (s.owner_id === ownerId && !sessionMap.has(s.id)) {
        sessionMap.set(s.id, s);
      }
    }

    return Array.from(sessionMap.values()).sort((a, b) => {
      const timeA = new Date(a.last_message_at || a.created_at).getTime();
      const timeB = new Date(b.last_message_at || b.created_at).getTime();
      return timeB - timeA;
    });
  }

  static async listMessages(sessionId) {
    let dbMessages = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select(await messageSelect())
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        dbMessages = data;
      }
    } catch (err) {
      console.error(`ChatModel.listMessages (${sessionId}) Error:`, err.message);
    }

    const memoryMsgs = inMemoryMessages.get(sessionId) || [];
    const msgMap = new Map();
    for (const m of dbMessages) msgMap.set(m.id, m);
    for (const m of memoryMsgs) if (!msgMap.has(m.id)) msgMap.set(m.id, m);

    return Array.from(msgMap.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  /**
   * Insert a message and bump the parent session's preview/unread counters.
   *
   * `attachment` is optional: { url, type, name, width, height }.
   *
   * Only the message insert is awaited. The session counter bump is a second
   * round-trip that nothing on the sending path is waiting to read, and the
   * caller broadcasts as soon as this resolves — awaiting it too put a whole
   * extra database latency between pressing send and the bubble turning solid.
   * The in-memory session copy is updated synchronously below, so the inbox
   * preview is already correct for anyone reading it before the write lands.
   */
  static async insertMessage({ sessionId, senderType, senderId, body, attachment = null }) {
    const createdAt = new Date().toISOString();
    const bumpUnreadKey = senderType === 'owner' ? 'unread_customer_count' : 'unread_owner_count';
    const preview = attachment ? (body ? `📷 ${body}` : '📷 Photo') : String(body).slice(0, 140);

    // Resolve the column set before building the payload: on an un-migrated
    // database the attachment has to ride along inside `body` instead.
    const select = await messageSelect();
    const hasRich = richColumns;

    let storedBody = body;
    if (attachment && !hasRich) {
      storedBody = body ? `${body}\n${attachment.url}` : attachment.url;
    }

    const payload = {
      session_id: sessionId,
      sender_type: senderType,
      sender_id: senderId || null,
      body: storedBody,
    };
    if (attachment && hasRich) {
      payload.attachment_url = attachment.url;
      payload.attachment_type = attachment.type || null;
      payload.attachment_name = attachment.name || null;
      payload.attachment_width = attachment.width || null;
      payload.attachment_height = attachment.height || null;
    }

    let savedMessage = null;
    try {
      const { data: message, error } = await supabaseAdmin
        .from('chat_messages')
        .insert(payload)
        .select(select)
        .maybeSingle();

      if (!error && message) {
        savedMessage = message;
      } else if (error) {
        console.warn('ChatModel.insertMessage DB insert warning:', error.message);
      }
    } catch (err) {
      console.warn('ChatModel.insertMessage DB Error (using in-memory):', err.message);
    }

    if (!savedMessage) {
      savedMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        session_id: sessionId,
        sender_type: senderType,
        sender_id: senderId || null,
        body: storedBody,
        created_at: createdAt,
        read_at: null,
        ...(attachment && hasRich
          ? {
              attachment_url: attachment.url,
              attachment_type: attachment.type || null,
              attachment_name: attachment.name || null,
              attachment_width: attachment.width || null,
              attachment_height: attachment.height || null,
            }
          : {}),
      };
    }

    // Update in-memory message store and session metadata
    const msgs = inMemoryMessages.get(sessionId) || [];
    msgs.push(savedMessage);
    inMemoryMessages.set(sessionId, msgs);

    const cachedSession = inMemorySessions.get(sessionId);
    const nextUnread = (cachedSession?.[bumpUnreadKey] || 0) + 1;
    if (cachedSession) {
      cachedSession.last_message_at = createdAt;
      cachedSession.last_message_preview = preview;
      cachedSession[bumpUnreadKey] = nextUnread;
      inMemorySessions.set(sessionId, cachedSession);
    }

    // Fire-and-forget — see the note above.
    supabaseAdmin
      .from('chat_sessions')
      .update({ last_message_at: createdAt, last_message_preview: preview, [bumpUnreadKey]: nextUnread })
      .eq('id', sessionId)
      .then(({ error }) => {
        if (error) console.warn('ChatModel.insertMessage session bump warning:', error.message);
      });

    return savedMessage;
  }

  /** Second tick: the recipient's socket was in the room when this was broadcast. */
  static async markDelivered(messageId) {
    const at = new Date().toISOString();
    if (richColumns) {
      supabaseAdmin
        .from('chat_messages')
        .update({ delivered_at: at })
        .eq('id', messageId)
        .then(({ error }) => {
          if (error) console.warn('ChatModel.markDelivered warning:', error.message);
        });
    }
    return at;
  }

  static async markRead(sessionId, readerType) {
    try {
      const unreadKey = readerType === 'owner' ? 'unread_owner_count' : 'unread_customer_count';
      // Whoever is reading, it's the OTHER side's messages that just became read —
      // the double tick renders on the sender's own bubbles.
      const peerType = readerType === 'owner' ? 'customer' : 'owner';
      const readAt = new Date().toISOString();

      await supabaseAdmin
        .from('chat_sessions')
        .update({ [unreadKey]: 0 })
        .eq('id', sessionId);

      // Without this the read tick only ever existed as a live socket event:
      // it looked right until either side reloaded, then every message the peer
      // had already read came back showing a single "sent" tick forever.
      await supabaseAdmin
        .from('chat_messages')
        .update({ read_at: readAt })
        .eq('session_id', sessionId)
        .eq('sender_type', peerType)
        .is('read_at', null);

      const cached = inMemorySessions.get(sessionId);
      if (cached) {
        cached[unreadKey] = 0;
        inMemorySessions.set(sessionId, cached);
      }
      for (const m of inMemoryMessages.get(sessionId) || []) {
        if (m.sender_type === peerType && !m.read_at) m.read_at = readAt;
      }
      return true;
    } catch (err) {
      console.error(`ChatModel.markRead (${sessionId}) Error:`, err.message);
      return false;
    }
  }

  static async closeSession(sessionId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .update({ status: 'closed' })
        .eq('id', sessionId)
        .select(SESSION_SELECT)
        .maybeSingle();

      if (!error && data) {
        inMemorySessions.set(sessionId, data);
        return data;
      }
    } catch (err) {
      console.error(`ChatModel.closeSession (${sessionId}) Error:`, err.message);
    }

    const cached = inMemorySessions.get(sessionId);
    if (cached) {
      cached.status = 'closed';
      inMemorySessions.set(sessionId, cached);
      return cached;
    }
    return null;
  }

  static async deleteSession(sessionId) {
    try {
      await supabaseAdmin
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      await supabaseAdmin
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);
    } catch (err) {
      console.error(`ChatModel.deleteSession (${sessionId}) Error:`, err.message);
    }

    inMemorySessions.delete(sessionId);
    inMemoryMessages.delete(sessionId);
    return true;
  }
}

module.exports = ChatModel;
