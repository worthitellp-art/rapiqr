const SmsMessage = require('./schemas/SmsMessage');

/**
 * Tracks every outbound SMS/WhatsApp send attempt (Twilio) so the admin
 * Message Manager can show real delivery stats instead of guessing from
 * scattered server_logs entries.
 */
class MessageModel {
  /**
   * Best-effort insert — never throws, never awaited by the caller for
   * correctness (a tracking failure must not affect whether the SMS itself
   * was sent).
   */
  static async record({ channel, to, event, status, sid = null, error = null, body = null }) {
    try {
      await SmsMessage.create({
        channel,
        to_number: to || null,
        event: event || null,
        status, // 'sent' | 'failed' | 'simulated'
        provider_sid: sid,
        error: error || null,
        body_preview: body ? String(body).slice(0, 160) : null,
      });
    } catch {
      // Non-blocking — tracking must never break a send.
    }
  }

  /**
   * Advance a delivery to the status the provider's webhook reported.
   * Best-effort like record(): a missing row (send predates tracking) is not
   * an error worth surfacing.
   */
  static async updateStatusByProviderId(providerMessageId, status) {
    if (!providerMessageId) return;
    try {
      await SmsMessage.updateMany({ provider_sid: providerMessageId }, { $set: { status } });
    } catch {
      // Non-blocking — a tracking failure must never fail a webhook.
    }
  }

  static async getMessages({ limit = 100, channel = null, status = null, event = null } = {}) {
    try {
      const query = {};
      if (channel && channel !== 'ALL') query.channel = channel;
      if (status && status !== 'ALL') query.status = status;
      if (event) query.event = event;

      const docs = await SmsMessage.find(query).sort({ created_at: -1 }).limit(limit).lean();
      return docs.map((d) => ({ ...d, id: String(d._id) }));
    } catch {
      return [];
    }
  }

  /**
   * Exact counts (not row-limited like getMessages), so the stat tiles stay
   * accurate however large the collection grows.
   */
  static async getStats() {
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [total, sent, failed, simulated, sms, whatsapp, last24h] = await Promise.all([
        SmsMessage.countDocuments({}),
        SmsMessage.countDocuments({ status: 'sent' }),
        SmsMessage.countDocuments({ status: 'failed' }),
        SmsMessage.countDocuments({ status: 'simulated' }),
        SmsMessage.countDocuments({ channel: 'sms' }),
        SmsMessage.countDocuments({ channel: 'whatsapp' }),
        SmsMessage.countDocuments({ created_at: { $gte: since24h } }),
      ]);

      return { total, sent, failed, simulated, sms, whatsapp, last24h };
    } catch {
      return { total: 0, sent: 0, failed: 0, simulated: 0, sms: 0, whatsapp: 0, last24h: 0 };
    }
  }
}

module.exports = MessageModel;
