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
// id-scheme v2: server-generated recovery code + HMAC-derived id (see
// QrModel.saveV2). New issuance only — existing v1 stickers are untouched.
router.post('/v2', verifyToken, verifyAdmin, QrController.saveQrCodeV2);
router.delete('/', verifyToken, verifyAdmin, QrController.deleteAllQrCodes);
router.delete('/:id', verifyToken, verifyAdmin, QrController.deleteQrCode);
router.post('/:id/restore', verifyToken, verifyAdmin, restoreLimiter, QrController.restoreQrCode);
// Public, code-only recovery for id-scheme v2 stickers — no sticker id
// needed from the caller at all (see QrModel.recoverByCodeV2). Declared
// before the generic '/:id' GET route only for readability; the two never
// collide since this is a POST on a static path.
router.post('/recover-by-code', restoreLimiter, QrController.recoverByCode);
// Public: anonymous visitors scan/activate a single sticker by ID
router.get('/:id', QrController.getQrCodeById);
// Public self-service recovery: a client (or anyone holding the sticker's
// printed recovery code) can bring back their own deleted/broken sticker
// without going through admin. Same handler as the admin route above — the
// recovery code itself is the access control, not the caller's session.
router.post('/:id/recover', restoreLimiter, QrController.restoreQrCode);
router.post('/:id/activate', QrController.activateQrCode);
router.post('/:id/send-activation-otp', activationOtpLimiter, QrController.sendActivationOtp);
router.post('/:id/verify-activation-otp', QrController.verifyActivationOtp);
router.post('/:id/scan', QrController.recordScan);

module.exports = router;
