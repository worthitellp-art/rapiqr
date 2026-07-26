const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/signup', AuthController.signUp);
router.post('/signin', AuthController.signIn);
router.post('/google', AuthController.googleAuth);
router.get('/me', verifyToken, AuthController.getMe);

module.exports = router;
