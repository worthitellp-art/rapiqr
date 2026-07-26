const express = require('express');
const router = express.Router();
const QrController = require('../controllers/qrController');

router.get('/', QrController.getQrCodes);
router.get('/:id', QrController.getQrCodeById);
router.post('/', QrController.saveQrCode);
router.post('/:id/activate', QrController.activateQrCode);
router.post('/:id/scan', QrController.recordScan);

module.exports = router;
