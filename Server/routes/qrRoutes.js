const express = require('express');
const router = express.Router();
const QrController = require('../controllers/qrController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

// Anonymous visitors could otherwise hammer Twilio (billing abuse) by spamming
// send-otp — same shape of protection as the Twilio call-bridge route.
const activationOtpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: 'Too many verification codes requested, please try again later.' });
// A 48-bit recovery code is infeasible to brute force regardless, but this is
// cheap insurance against a compromised/malicious admin session hammering it.
const restoreLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many restore attempts, please try again later.' });

// Admin-only: fleet management (bulk QR listing/creation/deletion). Sticker
// images are generated on-demand client-side (deterministic from id + colors +
// template placement) — nothing to upload or persist here.
router.get('/', verifyToken, verifyAdmin, QrController.getQrCodes);
router.post('/', verifyToken, verifyAdmin, QrController.saveQrCode);
router.delete('/', verifyToken, verifyAdmin, QrController.deleteAllQrCodes);
router.delete('/:id', verifyToken, verifyAdmin, QrController.deleteQrCode);
router.post('/:id/restore', verifyToken, verifyAdmin, restoreLimiter, QrController.restoreQrCode);
// Public: anonymous visitors scan/activate a single sticker by ID
router.get('/:id', QrController.getQrCodeById);
router.post('/:id/activate', QrController.activateQrCode);
router.post('/:id/send-activation-otp', activationOtpLimiter, QrController.sendActivationOtp);
router.post('/:id/verify-activation-otp', QrController.verifyActivationOtp);
router.post('/:id/scan', QrController.recordScan);

module.exports = router;
