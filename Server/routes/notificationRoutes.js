const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { rateLimit } = require('../middleware/rateLimiter');

// Public (fires right after an anonymous activation completes) — rate limited
// since the recipient is now resolved server-side from the sticker's own
// record, but repeated calls for the same real sticker could still be used
// to spam its owner.
const activationConfirmationLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10, message: 'Too many requests, please try again later.' });

router.post('/activation-confirmation', activationConfirmationLimiter, NotificationController.sendActivationConfirmation);

module.exports = router;
