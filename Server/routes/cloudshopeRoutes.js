const express = require('express');
const router = express.Router();
const cloudshopeController = require('../controllers/cloudshopeController');
const { rateLimit } = require('../middleware/rateLimiter');

const callLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 8, message: 'Too many call requests, please try again later.' });

// POST /api/cloudshope/call-bridge - Anonymous QR Calling Bridge (Cloudshope
// outboundCallQr), active replacement for the Exotel bridge at
// /api/exotel/call-bridge. Intentionally public (scan-page visitors are
// almost always anonymous), rate-limited per IP, target phone always
// resolved server-side from qrId — the caller can never redirect the bridge
// to an arbitrary number.
router.post('/call-bridge', callLimiter, cloudshopeController.getAnonymousCallNumber);

module.exports = router;
