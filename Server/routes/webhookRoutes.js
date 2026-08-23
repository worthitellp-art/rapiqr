const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');

// Public by design — the provider calls these. Both are protected by the verify
// token / payload signature rather than by our own auth middleware.
router.get('/whatsapp', WebhookController.verify);
router.post('/whatsapp', WebhookController.receive);

module.exports = router;
