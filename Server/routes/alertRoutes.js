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

// Public: anonymous visitors dispatch SOS/emergency alerts by scanning a sticker
router.post('/', alertLimiter, AlertController.createAlert);
// Admin-only: alert log contains reporter phone numbers + GPS locations
router.get('/', verifyToken, verifyAdmin, AlertController.getAlerts);

module.exports = router;
