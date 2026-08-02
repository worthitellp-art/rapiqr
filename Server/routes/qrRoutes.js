const express = require('express');
const router = express.Router();
const QrController = require('../controllers/qrController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Admin-only: fleet management (bulk QR listing/creation/sticker assets)
router.get('/', verifyToken, verifyAdmin, QrController.getQrCodes);
router.post('/', verifyToken, verifyAdmin, QrController.saveQrCode);
router.post('/:id/sticker', verifyToken, verifyAdmin, QrController.saveStickerImage);
// Public: anonymous visitors scan/activate a single sticker by ID
router.get('/:id', QrController.getQrCodeById);
router.post('/:id/activate', QrController.activateQrCode);
router.post('/:id/scan', QrController.recordScan);

module.exports = router;
