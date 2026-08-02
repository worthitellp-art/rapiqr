const express = require('express');
const router = express.Router();
const twilioController = require('../controllers/twilioController');
const { verifyToken } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

const bridgeCallLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: 'Too many call requests, please try again later.' });

// POST /api/twilio/call-bridge - Masked Emergency Call Bridge (auth + rate-limited to prevent billing abuse)
router.post('/call-bridge', verifyToken, bridgeCallLimiter, twilioController.initiateMaskedBridgeCall);

module.exports = router;
