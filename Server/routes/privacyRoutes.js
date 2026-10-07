const express = require('express');
const router = express.Router();
const PrivacyController = require('../controllers/privacyController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

// Grievances accept anonymous submissions and erasure is a one-shot destructive
// action — both worth a modest limiter, matching the pattern already used for
// alerts/activation elsewhere in the app.
const grievanceLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many grievance submissions — please try again later.' });
const erasureLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 3, message: 'Too many erasure requests — please try again later.' });

router.get('/me', verifyToken, PrivacyController.me);
router.patch('/me', verifyToken, PrivacyController.updateMe);
router.post('/avatar', verifyToken, PrivacyController.uploadAvatar);
router.get('/sharing', verifyToken, PrivacyController.sharing);

router.get('/consent', verifyToken, PrivacyController.listConsent);
router.post('/consent', verifyToken, PrivacyController.grantConsent);
router.post('/consent/withdraw', verifyToken, PrivacyController.withdrawConsent);

router.post('/erasure-otp', verifyToken, erasureLimiter, PrivacyController.sendErasureOtp);
router.post('/erasure-request', verifyToken, erasureLimiter, PrivacyController.requestErasure);
router.get('/export', verifyToken, PrivacyController.exportData);
router.post('/nominee', verifyToken, PrivacyController.setNominee);

router.post('/grievances', optionalAuth, grievanceLimiter, PrivacyController.submitGrievance);
router.get('/grievances', verifyToken, PrivacyController.listOwnGrievances);

module.exports = router;
