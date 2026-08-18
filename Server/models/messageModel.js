const { supabaseAdmin } = require('../config/db');

/**
 * Tracks every outbound SMS/WhatsApp send attempt (Twilio) so the admin
 * Message Manager can show real delivery stats instead of guessing from
 * scattered server_logs entries. Same graceful-degradation pattern as
 * logModel.js — if the `messages` table hasn't been created in Supabase yet,
 * inserts/reads no-op instead of breaking the send path that's calling this.
 */
let tableExists = true;

class MessageModel {
  /**
   * Best-effort insert — never throws, never awaited by the caller for
   * correctness (a tracking failure must not affect whether the SMS itself
   * was sent).
   */
  static async record({ channel, to, event, status, sid = null, error = null, body = null }) {
    if (!supabaseAdmin) return;
    try {
      const { error: dbError } = await supabaseAdmin.from('messages').insert([{
        channel,
        to_number: to || null,
        event: event || null,
        status, // 'sent' | 'failed' | 'simulated'
        provider_sid: sid,
        error: error || null,
        body_preview: body ? String(body).slice(0, 160) : null,
      }]);
      if (dbError && dbError.code === '42P01') {
        if (tableExists) {
          tableExists = false;
          console.warn("[MESSAGE_MODEL] Note: 'messages' table not created in Supabase yet — message tracking disabled.");
        }
      }
    } catch {
      // Non-blocking — tracking must never break a send.
    }
  }

  static async getMessages({ limit = 100, channel = null, status = null, event = null } = {}) {
    if (!supabaseAdmin) return [];
    try {
      let query = supabaseAdmin
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (channel && channel !== 'ALL') query = query.eq('channel', channel);
      if (status && status !== 'ALL') query = query.eq('status', status);
      if (event) query = query.eq('event', event);

      const { data, error } = await query;
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }

  /**
   * Exact counts via head queries (not row-limited like getMessages), so the
   * stat tiles stay accurate however large the table grows.
   */
  static async getStats() {
    if (!supabaseAdmin) {
      return { total: 0, sent: 0, failed: 0, simulated: 0, sms: 0, whatsapp: 0, last24h: 0 };
    }
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const count = async (build) => {
        let q = supabaseAdmin.from('messages').select('*', { count: 'exact', head: true });
        q = build(q);
        const { count: c, error } = await q;
        return error ? 0 : (c || 0);
      };

      const [total, sent, failed, simulated, sms, whatsapp, last24h] = await Promise.all([
        count((q) => q),
        count((q) => q.eq('status', 'sent')),
        count((q) => q.eq('status', 'failed')),
        count((q) => q.eq('status', 'simulated')),
        count((q) => q.eq('channel', 'sms')),
        count((q) => q.eq('channel', 'whatsapp')),
        count((q) => q.gte('created_at', since24h)),
      ]);

      return { total, sent, failed, simulated, sms, whatsapp, last24h };
    } catch {
      return { total: 0, sent: 0, failed: 0, simulated: 0, sms: 0, whatsapp: 0, last24h: 0 };
    }
  }
}

module.exports = MessageModel;
