const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');
const PaymentController = require('../controllers/paymentController');
const ShiprocketController = require('../controllers/shiprocketController');

// Public by design — the provider calls these. Each is protected by its own
// verify token / payload signature rather than by our auth middleware, and each
// fails closed when its secret is unset.
router.get('/whatsapp', WebhookController.verify);
router.post('/whatsapp', WebhookController.receive);

// Razorpay payment events (RAZORPAY_WEBHOOK_SECRET, HMAC over the raw body).
// Subscribe to: payment.captured, payment.failed, order.paid
router.post('/razorpay', PaymentController.webhook);

// Shiprocket courier delivery updates (SHIPROCKET_WEBHOOK_TOKEN, sent as x-api-key).
router.post('/shiprocket', ShiprocketController.webhook);

// MSG91 OTP Widget events/actions (MSG91_WEBHOOK_SECRET, sent as the
// x-webhook-secret header — set that header in the widget's webhook config).
router.post('/msg91-otp', WebhookController.msg91OtpWidget);

module.exports = router;
