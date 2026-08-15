const express = require('express');
const router = express.Router();
const ShiprocketController = require('../controllers/shiprocketController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, verifyAdmin);

router.get('/dashboard', ShiprocketController.getDashboard);
router.post('/orders/:orderId/ship', ShiprocketController.createShipmentForOrder);
router.get('/orders/:orderId/track', ShiprocketController.trackShipment);

module.exports = router;
