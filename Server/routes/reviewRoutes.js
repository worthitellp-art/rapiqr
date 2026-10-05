const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Review management endpoints (Admin only)
router.use(verifyToken, verifyAdmin);

router.get('/', ReviewController.listReviews);
router.post('/:id/reply', ReviewController.replyReview);
router.post('/:id/ai-reply', ReviewController.generateAiReply);
router.patch('/:id/status', ReviewController.updateStatus);
router.delete('/:id', ReviewController.deleteReview);

module.exports = router;
