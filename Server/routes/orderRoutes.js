const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { optionalAuth, verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, OrderController.create);
router.get('/mine', verifyToken, OrderController.mine);
router.get('/', verifyToken, verifyAdmin, OrderController.list);

module.exports = router;
