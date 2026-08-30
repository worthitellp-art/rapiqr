const express = require('express');
const router = express.Router();
const PushController = require('../controllers/pushController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/vapid-public-key', PushController.getPublicKey);
router.post('/subscribe', verifyToken, PushController.subscribe);
router.post('/unsubscribe', verifyToken, PushController.unsubscribe);

module.exports = router;
