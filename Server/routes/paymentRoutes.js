const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Guest checkout is allowed, so these stay optionalAuth like /api/orders —
// the order's own userId (attached at creation) is what links a payment to an account.
router.post('/create-order', optionalAuth, PaymentController.createOrder);
router.post('/verify', optionalAuth, PaymentController.verify);

module.exports = router;
