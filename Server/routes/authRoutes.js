const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

// Keyed by IP (these routes run before a token exists) — blunts credential
// stuffing / brute force and mass account creation without external deps.
const signInLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many sign-in attempts, please try again later.' });
const adminSignInLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many admin sign-in attempts, please try again later.' });
const signUpLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many accounts created from this network, please try again later.' });
const passwordResetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many password reset requests, please try again later.' });

router.post('/signup', signUpLimiter, AuthController.signUp);
router.post('/signin', signInLimiter, AuthController.signIn);
router.post('/admin-signin', adminSignInLimiter, AuthController.adminSignIn);
router.post('/google', AuthController.googleAuth);
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, AuthController.resetPassword);
router.get('/me', verifyToken, AuthController.getMe);
router.patch('/me', verifyToken, AuthController.updateProfile);
router.post('/phone/send-otp', verifyToken, AuthController.sendPhoneOtp);
router.post('/phone/verify-otp', verifyToken, AuthController.verifyPhoneOtp);
router.delete('/me', verifyToken, AuthController.deleteAccount);
router.post('/change-password', verifyToken, AuthController.changePassword);
router.post('/change-email', verifyToken, AuthController.changeEmail);
router.post('/2fa/setup', verifyToken, AuthController.setupTwoFactor);
router.post('/2fa/verify', verifyToken, AuthController.verifyTwoFactor);
router.post('/2fa/disable', verifyToken, AuthController.disableTwoFactor);

module.exports = router;
