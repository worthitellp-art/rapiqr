const { supabaseAdmin } = require('../config/db');

const SESSION_SELECT = 'id, qr_code_id, owner_id, customer_token, customer_name, vehicle_label, status, last_message_at, last_message_preview, unread_owner_count, unread_customer_count, created_at';

class ChatModel {
  /**
   * Reuse the still-open session for this (qrCodeId, customerToken) pair if one
   * exists (partial unique index enforces at most one open session per pair),
   * otherwise create a fresh one.
   */
  static async findOrCreateOpenSession({ qrCodeId, customerToken, customerName, ownerId, vehicleLabel }) {
    try {
      const { data: existing, error: findError } = await supabaseAdmin
        .from('chat_sessions')
        .select(SESSION_SELECT)
        .eq('qr_code_id', qrCodeId)
        .eq('customer_token', customerToken)
        .eq('status', 'open')
        .maybeSingle();

      if (findError) throw findError;
      if (existing) return { session: existing, isNew: false };

      const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          qr_code_id: qrCodeId,
          owner_id: ownerId || null,
          customer_token: customerToken,
          customer_name: customerName || 'Visitor',
          vehicle_label: vehicleLabel || null,
        })
        .select(SESSION_SELECT)
        .single();

      if (error) throw error;
      return { session: data, isNew: true };
    } catch (err) {
      console.error('ChatModel.findOrCreateOpenSession Error:', err);
      return { session: null, isNew: false };
    }
  }

  static async getSessionById(sessionId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .select(SESSION_SELECT)
        .eq('id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`ChatModel.getSessionById (${sessionId}) Error:`, err);
      return null;
    }
  }

  static async listSessionsForOwner(ownerId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .select(SESSION_SELECT)
        .eq('owner_id', ownerId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`ChatModel.listSessionsForOwner (${ownerId}) Error:`, err);
      return [];
    }
  }

  static async listMessages(sessionId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select('id, session_id, sender_type, sender_id, body, created_at, read_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`ChatModel.listMessages (${sessionId}) Error:`, err);
      return [];
    }
  }

  /**
   * Insert a message and bump the parent session's preview/unread counters in
   * one call so the owner inbox list never drifts out of sync with the thread.
   */
  static async insertMessage({ sessionId, senderType, senderId, body }) {
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
        .single();

      if (error) throw error;

      const bumpUnreadKey = senderType === 'owner' ? 'unread_customer_count' : 'unread_owner_count';
      const session = await this.getSessionById(sessionId);
      await supabaseAdmin
        .from('chat_sessions')
        .update({
          last_message_at: message.created_at,
          last_message_preview: String(body).slice(0, 140),
          [bumpUnreadKey]: (session?.[bumpUnreadKey] || 0) + 1,
        })
        .eq('id', sessionId);

      return message;
    } catch (err) {
      console.error('ChatModel.insertMessage Error:', err);
      return null;
    }
  }

  static async markRead(sessionId, readerType) {
    try {
      const unreadKey = readerType === 'owner' ? 'unread_owner_count' : 'unread_customer_count';
      const { error } = await supabaseAdmin
        .from('chat_sessions')
        .update({ [unreadKey]: 0 })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error(`ChatModel.markRead (${sessionId}) Error:`, err);
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

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`ChatModel.closeSession (${sessionId}) Error:`, err);
      return null;
    }
  }
}

module.exports = ChatModel;
