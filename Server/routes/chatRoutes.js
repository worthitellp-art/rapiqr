const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { verifyToken, optionalAuth, verifyAdmin } = require('../middleware/authMiddleware');

// Public: anonymous visitors start/resume a RepiChat thread by scanning a sticker
router.post('/sessions', optionalAuth, ChatController.startSession);

// Owner-only: the dashboard inbox listing all of an owner's chat threads
router.get('/owner/sessions', verifyToken, ChatController.listOwnerSessions);

// Admin-only: who's currently connected (presence), not conversation content
router.get('/admin/online-owners', verifyToken, verifyAdmin, ChatController.listOnlineOwners);

// Both sides — authorized per-request via req.user (owner) or x-customer-token (customer)
router.get('/sessions/:id/messages', optionalAuth, ChatController.getMessages);
router.post('/sessions/:id/messages', optionalAuth, ChatController.sendMessageRest);
router.patch('/sessions/:id/read', optionalAuth, ChatController.markRead);

// Owner-only: end the conversation
router.patch('/sessions/:id/close', verifyToken, ChatController.closeSession);

module.exports = router;
