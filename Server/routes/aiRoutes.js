const express = require('express');
const router = express.Router();
const AiController = require('../controllers/aiController');
const { rateLimit } = require('../middleware/rateLimiter');

const aiChatLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, message: 'Too many AI chat requests, please try again later.' });

// Public: anonymous scan-page visitors use the emergency AI assistant
router.post('/chat', aiChatLimiter, AiController.chat);

module.exports = router;
