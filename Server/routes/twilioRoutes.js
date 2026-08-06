const express = require('express');
const router = express.Router();
const twilioController = require('../controllers/twilioController');
const { rateLimit } = require('../middleware/rateLimiter');

const bridgeCallLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: 'Too many call requests, please try again later.' });

// POST /api/twilio/call-bridge - Masked Emergency Call Bridge. Intentionally public
// (not verifyToken) — the scan-page visitor placing this call is almost always
// anonymous, same as /api/qr/:id/activate and POST /api/alerts. Rate-limited per IP
// to bound billing abuse, and the target phone is always resolved server-side from
// the product record (see twilioController.js) so the caller can never redirect the
// bridge to an arbitrary number.
router.post('/call-bridge', bridgeCallLimiter, twilioController.initiateMaskedBridgeCall);

// Twilio-fetched webhook — see serveBridgeTwiml in twilioController.js for why
// this exists (trial accounts reject inline TwiML on Calls.json, only a Url
// webhook is allowed). Registered for both verbs since Twilio's default
// fetch method can vary by call configuration.
router.all('/twiml/bridge/:bridgeId', twilioController.serveBridgeTwiml);
router.all('/twiml/conference/:confName', twilioController.serveConferenceTwiml);

module.exports = router;
