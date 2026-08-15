const express = require('express');
const router = express.Router();
const exotelController = require('../controllers/exotelController');
const { rateLimit } = require('../middleware/rateLimiter');

const bridgeCallLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: 'Too many call requests, please try again later.' });

// POST /api/exotel/call-bridge - Masked Emergency Call Bridge, active
// replacement for the Twilio version at /api/twilio/call-bridge (see
// twilioRoutes.js). Intentionally public (scan-page visitors are almost
// always anonymous), rate-limited per IP, target phone always resolved
// server-side from the product record — the caller can never redirect the
// bridge to an arbitrary number.
router.post('/call-bridge', bridgeCallLimiter, exotelController.initiateMaskedBridgeCall);

module.exports = router;
