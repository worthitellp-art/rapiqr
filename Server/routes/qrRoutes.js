const express = require('express');
const router = express.Router();
const QrController = require('../controllers/qrController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

// Anonymous visitors could otherwise hammer Twilio (billing abuse) by spamming
// send-otp — same shape of protection as the Twilio call-bridge route.
const activationOtpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: 'Too many verification codes requested, please try again later.' });

// Admin-only: fleet management (bulk QR listing/creation/sticker assets/deletion)
router.get('/', verifyToken, verifyAdmin, QrController.getQrCodes);
router.post('/', verifyToken, verifyAdmin, QrController.saveQrCode);
router.delete('/', verifyToken, verifyAdmin, QrController.deleteAllQrCodes);
router.delete('/:id', verifyToken, verifyAdmin, QrController.deleteQrCode);
router.post('/:id/sticker', verifyToken, verifyAdmin, QrController.saveStickerImage);
// Public: anonymous visitors scan/activate a single sticker by ID
router.get('/:id', QrController.getQrCodeById);
router.post('/:id/activate', QrController.activateQrCode);
router.post('/:id/send-activation-otp', activationOtpLimiter, QrController.sendActivationOtp);
router.post('/:id/verify-activation-otp', QrController.verifyActivationOtp);
router.post('/:id/scan', QrController.recordScan);

module.exports = router;
