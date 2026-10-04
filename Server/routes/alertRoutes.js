const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/alertController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

// This is the one public write endpoint a scanner can hit unauthenticated, and
// every call notifies a real person. Without a cap, one script could bury an
// owner in alerts. Generous enough for a genuine emergency (a panicked scanner
// pressing twice, then sharing location) but not for a flood.
const alertLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: 'Too many alerts sent from this device. Please wait a few minutes before trying again.',
});

// Live-location pings go out every 5 seconds (about 120 per 10 minutes) and notify
// nobody — they only move the card in the chat. They get their own, far higher
// limit, so they can't use up the quota that a real alert needs.
const locationPingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 300,
  message: 'Location updates are arriving too fast. Please slow down.',
});

const limitByKind = (req, res, next) =>
  (req.body?.type === 'location_ping' ? locationPingLimiter : alertLimiter)(req, res, next);

// Public: anonymous visitors dispatch SOS/emergency alerts by scanning a sticker
router.post('/', limitByKind, AlertController.createAlert);
// Admin-only: alert log contains reporter phone numbers + GPS locations
router.get('/', verifyToken, verifyAdmin, AlertController.getAlerts);
router.delete('/', verifyToken, verifyAdmin, AlertController.deleteAllAlerts);
router.delete('/:id', verifyToken, verifyAdmin, AlertController.deleteAlert);
router.patch('/:id/resolve', verifyToken, verifyAdmin, AlertController.resolveAlert);

module.exports = router;
