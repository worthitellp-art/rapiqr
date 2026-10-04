const express = require('express');
const router = express.Router();
const GeoController = require('../controllers/geoController');
const { rateLimit } = require('../middleware/rateLimiter');

// Public (used by the Join Us and checkout forms before sign-in). Tight per-IP
// cap because every miss becomes an outbound call to a free third-party API.
const geoLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 40, message: 'Too many location lookups, please try again shortly.' });

router.get('/reverse', geoLimiter, GeoController.reverse);
router.get('/forward', geoLimiter, GeoController.forward);
router.get('/pincode/:pin', geoLimiter, GeoController.pincode);

module.exports = router;
