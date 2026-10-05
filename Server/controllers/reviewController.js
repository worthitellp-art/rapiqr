const Review = require('../models/schemas/Review');
const { logger } = require('../middleware/loggerMiddleware');
const { sendServerError } = require('../utils/httpErrors');

class ReviewController {
  static async listReviews(req, res) {
    try {
      const { search, rating, status, replyStatus, limit = 50, page = 1 } = req.query;
      const query = {};

      if (rating && rating !== 'all') {
        query.rating = Number(rating);
      }
      if (status && status !== 'all') {
        query.status = status;
      }
      if (replyStatus === 'replied') {
        query['reply.text'] = { $ne: null };
      } else if (replyStatus === 'unreplied') {
        query['reply.text'] = null;
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { customer_name: regex },
          { product_name: regex },
          { review_text: regex },
        ];
      }

      const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
      const [docs, total] = await Promise.all([
        Review.find(query).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
        Review.countDocuments(query),
      ]);

      const mapped = docs.map((d) => ({
        id: d._id.toString(),
        customerName: d.customer_name,
        customerPhone: d.customer_phone,
        customerEmail: d.customer_email,
        productName: d.product_name,
        rating: d.rating,
        reviewText: d.review_text,
        status: d.status,
        reply: d.reply?.text
          ? {
              text: d.reply.text,
              repliedAt: d.reply.replied_at,
              isAiGenerated: Boolean(d.reply.is_ai_generated),
            }
          : undefined,
        createdAt: d.created_at,
      }));

      return res.json({ success: true, data: mapped, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    } catch (err) {
      logger.error('REVIEWS_LIST', 'Failed to fetch reviews', err);
      return sendServerError(res, err);
    }
  }

  static async replyReview(req, res) {
    try {
      const { id } = req.params;
      const { text, isAiGenerated = false } = req.body || {};

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Reply text is required' });
      }

      const updated = await Review.findByIdAndUpdate(
        id,
        {
          $set: {
            reply: {
              text: text.trim(),
              replied_at: new Date(),
              is_ai_generated: Boolean(isAiGenerated),
            },
            updated_at: new Date(),
          },
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('REVIEWS_REPLY', 'Failed to save review reply', err);
      return sendServerError(res, err);
    }
  }

  static async generateAiReply(req, res) {
    try {
      const { id } = req.params;
      const review = await Review.findById(id).lean();
      if (!review) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      let drafted = '';
      if (review.rating >= 4) {
        drafted = `Dear ${review.customer_name}, thank you so much for the wonderful ${review.rating}-star review of the ${review.product_name}! We're thrilled that our privacy protection and instant QR scanning are giving you peace of mind on the road.`;
      } else if (review.rating === 3) {
        drafted = `Hi ${review.customer_name}, thank you for your candid feedback on the ${review.product_name}. We're continuously refining our tags and dispatch workflows, and we'd love to make this a 5-star experience for you.`;
      } else {
        drafted = `Hello ${review.customer_name}, we sincerely apologize that your experience with the ${review.product_name} did not meet expectations. We take this very seriously and our support team would be delighted to send you a complimentary replacement right away.`;
      }

      return res.json({ success: true, draftedReply: drafted });
    } catch (err) {
      logger.error('REVIEWS_AI_REPLY', 'Failed to generate AI reply', err);
      return sendServerError(res, err);
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      if (!['published', 'flagged', 'pending'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const updated = await Review.findByIdAndUpdate(
        id,
        { $set: { status, updated_at: new Date() } },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('REVIEWS_UPDATE_STATUS', 'Failed to update review status', err);
      return sendServerError(res, err);
    }
  }

  static async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Review.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }
      return res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
      logger.error('REVIEWS_DELETE', 'Failed to delete review', err);
      return sendServerError(res, err);
    }
  }
}

module.exports = ReviewController;
