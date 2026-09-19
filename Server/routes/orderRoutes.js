const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { optionalAuth, verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, OrderController.create);
router.get('/mine', verifyToken, OrderController.mine);

// Secure buyer delivery tracking (accessible by logged-in owner or guest with phone/email verification)
router.get('/:id/track', optionalAuth, OrderController.track);
router.post('/track', optionalAuth, OrderController.trackByLookup);
router.post('/track-by-phone', optionalAuth, OrderController.trackByPhone);

router.get('/', verifyToken, verifyAdmin, OrderController.list);
router.patch('/:id/status', verifyToken, verifyAdmin, OrderController.updateStatus);
router.delete('/:id', verifyToken, verifyAdmin, OrderController.delete);
router.delete('/', verifyToken, verifyAdmin, OrderController.deleteAll);

module.exports = router;
