const User = require('../models/schemas/User');
const pushService = require('./pushService');
const { logger } = require('../middleware/loggerMiddleware');

/**
 * Web Push to every admin device that has subscribed from the admin console.
 * Best-effort: a push failure must never fail the request that triggered it.
 *
 * `alwaysShow` tells the service worker to show the OS notification even when an
 * admin tab is open. Without it an open dashboard silently swallows the alert.
 */
async function notifyAdmins(payload) {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    const body = { ...payload, alwaysShow: true };
    const results = await Promise.all(
      admins.map((a) => pushService.sendToUser(String(a._id), body).catch((err) => {
        logger.warn('ADMIN_PUSH', `Push to admin ${a._id} failed: ${err?.message || err}`);
        return { sent: 0, failed: 1 };
      }))
    );
    const sent = results.reduce((n, r) => n + (r?.sent || 0), 0);
    const failed = results.reduce((n, r) => n + (r?.failed || 0), 0);
    if (admins.length === 0) {
      logger.warn('ADMIN_PUSH', 'No admin account exists, so no push was sent.');
    } else if (sent === 0) {
      logger.warn('ADMIN_PUSH', `No admin device received "${payload.title}" (admins: ${admins.length}, failed: ${failed}). Turn on notifications in the admin console on the device you want alerts on.`);
    } else {
      logger.info('ADMIN_PUSH', `"${payload.title}" sent to ${sent} admin device(s)${failed ? `, ${failed} failed` : ''}.`);
    }
  } catch (err) {
    logger.warn('ADMIN_PUSH', `Could not notify admins: ${err?.message || err}`);
  }
}

module.exports = { notifyAdmins };
