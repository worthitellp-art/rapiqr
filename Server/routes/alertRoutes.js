const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/alertController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Public: anonymous visitors dispatch SOS/emergency alerts by scanning a sticker
router.post('/', AlertController.createAlert);
// Admin-only: alert log contains reporter phone numbers + GPS locations
router.get('/', verifyToken, verifyAdmin, AlertController.getAlerts);

module.exports = router;
