const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { optionalAuth, verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, OrderController.create);
router.get('/mine', verifyToken, OrderController.mine);
// Scoped to the caller's own order inside the controller — a buyer tracking
// their delivery must not need the admin-only Shiprocket routes.
router.get('/:id/track', verifyToken, OrderController.track);
router.get('/', verifyToken, verifyAdmin, OrderController.list);
router.patch('/:id/status', verifyToken, verifyAdmin, OrderController.updateStatus);
router.delete('/:id', verifyToken, verifyAdmin, OrderController.delete);
router.delete('/', verifyToken, verifyAdmin, OrderController.deleteAll);

module.exports = router;
