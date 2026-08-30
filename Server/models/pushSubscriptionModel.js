const PushSubscription = require('./schemas/PushSubscription');

class PushSubscriptionModel {
  /**
   * Save a browser's push registration. Upserted by endpoint (the browser's
   * own unique push URL) so re-subscribing the same device — e.g. after
   * clearing site data — never creates a duplicate row.
   */
  static async save(userId, subscription) {
    const { endpoint, keys } = subscription || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new Error('A valid push subscription (endpoint + keys.p256dh + keys.auth) is required');
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: String(endpoint) },
      { $set: { user_id: userId, keys: { p256dh: String(keys.p256dh), auth: String(keys.auth) } } },
      { upsert: true }
    );
    return true;
  }

  // userId, when given, scopes the delete to that owner's own subscription —
  // used by the authenticated unsubscribe endpoint so one account can never
  // remove another's registration even if it somehow knew its endpoint URL.
  static async removeByEndpoint(endpoint, userId = null) {
    if (!endpoint || typeof endpoint !== 'string') return;
    const filter = { endpoint };
    if (userId) filter.user_id = userId;
    await PushSubscription.deleteOne(filter);
  }

  static async getAllForUser(userId) {
    if (!userId) return [];
    return PushSubscription.find({ user_id: userId }).lean();
  }
}

module.exports = PushSubscriptionModel;
