const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/signup', AuthController.signUp);
router.post('/signin', AuthController.signIn);
router.post('/admin-signin', AuthController.adminSignIn);
router.post('/google', AuthController.googleAuth);
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
