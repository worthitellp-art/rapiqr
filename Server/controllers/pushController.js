const PushSubscriptionModel = require('../models/pushSubscriptionModel');
const pushService = require('../services/pushService');
const { logger } = require('../middleware/loggerMiddleware');

class PushController {
  /** GET /api/push/vapid-public-key — public; the frontend needs this to open a subscription. */
  static getPublicKey(req, res) {
    if (!pushService.isConfigured) {
      return res.status(503).json({ success: false, error: 'Push notifications are not configured on the server.' });
    }
    return res.json({ success: true, publicKey: pushService.publicKey });
  }

  /** POST /api/push/subscribe — save this device's push registration for the logged-in owner. */
  static async subscribe(req, res) {
    try {
      const { subscription } = req.body || {};
      await PushSubscriptionModel.save(req.user.id, subscription);
      logger.user('PUSH_SUBSCRIBED', `Push subscription saved for ${req.user.email}`);
      return res.json({ success: true });
    } catch (err) {
      logger.error('PUSH_SUBSCRIBE', 'Failed to save push subscription', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to save subscription' });
    }
  }

  /** POST /api/push/unsubscribe — drop this device's registration (e.g. user turned notifications off). */
  static async unsubscribe(req, res) {
    try {
      const { endpoint } = req.body || {};
      if (!endpoint) return res.status(400).json({ success: false, error: 'endpoint is required' });
      await PushSubscriptionModel.removeByEndpoint(endpoint, req.user.id);
      return res.json({ success: true });
    } catch (err) {
      logger.error('PUSH_UNSUBSCRIBE', 'Failed to remove push subscription', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = PushController;
