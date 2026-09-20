const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

// Keyed by IP (these routes run before a token exists) — blunts credential
// stuffing / brute force and mass account creation without external deps.
const signInLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many sign-in attempts, please try again later.' });
const signUpLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many accounts created from this network, please try again later.' });
const passwordResetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many password reset requests, please try again later.' });
// Email OTP IS the login credential (no password behind it) — sending is capped
// tighter than signIn to keep it from being usable as an email bomb, and
// verifying is capped like any other unauthenticated code-guessing surface.
const emailOtpSendLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many code requests, please try again later.' });
const emailOtpVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many attempts, please try again later.' });
// TOTP is a 6-digit code re-used for 30s at a time — with no throttle here it
// was brute-forceable in well under a million tries at typical request rates.
const twoFactorVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many 2FA attempts, please try again later.' });

const phoneOtpSendLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many code requests, please try again later.' });
const phoneOtpVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many attempts, please try again later.' });
// Admin login is the highest-value target in the system — tighter caps than the
// regular phone-login OTP routes above.
const adminPhoneOtpSendLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many code requests, please try again later.' });
const adminPhoneOtpVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many attempts, please try again later.' });

router.get('/msg91-widget-config', AuthController.getMsg91WidgetConfig);
router.post('/phone-login/send', phoneOtpSendLimiter, AuthController.sendPhoneLoginOtp);
router.post('/phone-login/verify', phoneOtpVerifyLimiter, AuthController.verifyPhoneLoginOtp);
router.post('/admin-phone-login/send', adminPhoneOtpSendLimiter, AuthController.sendAdminPhoneOtp);
router.post('/admin-phone-login/verify', adminPhoneOtpVerifyLimiter, AuthController.verifyAdminPhoneOtp);
router.post('/signup', signUpLimiter, AuthController.signUp);
router.post('/signin', signInLimiter, AuthController.signIn);
router.post('/google', AuthController.googleAuth);
router.post('/email-otp/send', emailOtpSendLimiter, AuthController.sendEmailOtp);
router.post('/email-otp/verify', emailOtpVerifyLimiter, AuthController.verifyEmailOtp);
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, AuthController.resetPassword);
router.post('/forgot-password/whatsapp/send', passwordResetLimiter, AuthController.forgotPasswordWhatsApp);
router.post('/forgot-password/whatsapp/verify', passwordResetLimiter, AuthController.verifyForgotPasswordWhatsApp);
router.get('/me', verifyToken, AuthController.getMe);
router.patch('/me', verifyToken, AuthController.updateProfile);
router.post('/logout', optionalAuth, AuthController.logout);
router.post('/phone/send-otp', verifyToken, AuthController.sendPhoneOtp);
router.post('/phone/verify-otp', verifyToken, AuthController.verifyPhoneOtp);
router.delete('/me', verifyToken, AuthController.deleteAccount);
router.post('/change-password', verifyToken, AuthController.changePassword);
router.post('/change-email', verifyToken, AuthController.changeEmail);
router.post('/2fa/setup', verifyToken, AuthController.setupTwoFactor);
router.post('/2fa/verify', verifyToken, twoFactorVerifyLimiter, AuthController.verifyTwoFactor);
router.post('/2fa/disable', verifyToken, AuthController.disableTwoFactor);

module.exports = router;
