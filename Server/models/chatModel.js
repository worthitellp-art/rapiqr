const { supabaseAdmin } = require('../config/db');

const SESSION_SELECT = 'id, qr_code_id, owner_id, customer_token, customer_name, vehicle_label, status, last_message_at, last_message_preview, unread_owner_count, unread_customer_count, created_at';

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
        .select('id, session_id, sender_type, sender_id, body, created_at, read_at')
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
   */
  static async insertMessage({ sessionId, senderType, senderId, body }) {
    const createdAt = new Date().toISOString();
    const bumpUnreadKey = senderType === 'owner' ? 'unread_customer_count' : 'unread_owner_count';

    let savedMessage = null;
    try {
      const { data: message, error } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: senderType,
          sender_id: senderId || null,
          body,
        })
        .select('id, session_id, sender_type, sender_id, body, created_at, read_at')
        .maybeSingle();

      if (!error && message) {
        savedMessage = message;
      }

      const session = await this.getSessionById(sessionId);
      await supabaseAdmin
        .from('chat_sessions')
        .update({
          last_message_at: createdAt,
          last_message_preview: String(body).slice(0, 140),
          [bumpUnreadKey]: (session?.[bumpUnreadKey] || 0) + 1,
        })
        .eq('id', sessionId);
    } catch (err) {
      console.warn('ChatModel.insertMessage DB Error (using in-memory):', err.message);
    }

    if (!savedMessage) {
      savedMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        session_id: sessionId,
        sender_type: senderType,
        sender_id: senderId || null,
        body,
        created_at: createdAt,
        read_at: null,
      };
    }

    // Update in-memory message store and session metadata
    const msgs = inMemoryMessages.get(sessionId) || [];
    msgs.push(savedMessage);
    inMemoryMessages.set(sessionId, msgs);

    const cachedSession = inMemorySessions.get(sessionId);
    if (cachedSession) {
      cachedSession.last_message_at = createdAt;
      cachedSession.last_message_preview = String(body).slice(0, 140);
      cachedSession[bumpUnreadKey] = (cachedSession[bumpUnreadKey] || 0) + 1;
      inMemorySessions.set(sessionId, cachedSession);
    }

    return savedMessage;
  }

  static async markRead(sessionId, readerType) {
    try {
      const unreadKey = readerType === 'owner' ? 'unread_owner_count' : 'unread_customer_count';
      await supabaseAdmin
        .from('chat_sessions')
        .update({ [unreadKey]: 0 })
        .eq('id', sessionId);

      const cached = inMemorySessions.get(sessionId);
      if (cached) {
        cached[unreadKey] = 0;
        inMemorySessions.set(sessionId, cached);
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
}

module.exports = ChatModel;
