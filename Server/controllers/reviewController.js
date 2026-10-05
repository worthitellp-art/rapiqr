const mongoose = require('mongoose');
const Review = require('../models/schemas/Review');
const { logger } = require('../middleware/loggerMiddleware');
const { sendServerError } = require('../utils/httpErrors');

let hasCheckedSeed = false;

function buildIdQuery(id) {
  if (!id) return null;
  const conditions = [{ custom_id: String(id) }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    conditions.unshift({ _id: new mongoose.Types.ObjectId(id) });
  }
  return { $or: conditions };
}

async function ensureSeededReviews() {
  if (hasCheckedSeed) return;
  hasCheckedSeed = true;
  try {
    const count = await Review.countDocuments();
    if (count === 0) {
      const seedDocs = [
        {
          custom_id: 'rev-101',
          customer_name: 'Aarav Sharma',
          customer_phone: '+91 98201 44321',
          customer_email: 'aarav.sharma@gmail.com',
          product_name: 'Car QR Sticker — Matte Metallic',
          rating: 5,
          review_text: "The metallic matte QR sticker looks premium on my car window. Tested the scan with a stranger's phone and it connected to my call instantly without exposing my number!",
          status: 'published',
          reply: {
            text: 'Thank you Aarav! We engineered the masked helpline call bridge specifically for instant privacy.',
            replied_at: new Date(Date.now() - 3600000 * 2),
            is_ai_generated: false,
          },
          created_at: new Date(Date.now() - 3600000 * 4),
        },
        {
          custom_id: 'rev-102',
          customer_name: 'Pooja Patel',
          customer_phone: '+91 98765 21098',
          customer_email: 'pooja.patel@outlook.com',
          product_name: 'Car QR Sticker — Premium Vinyl',
          rating: 5,
          review_text: 'Saved my car from being towed! A neighbour scanned the sticker when someone blocked the driveway and we sorted it out in two minutes. Absolutely worth it.',
          status: 'published',
          reply: {
            text: 'So happy to hear that Pooja! Preventing towing and parking disputes is our #1 goal.',
            replied_at: new Date(Date.now() - 86400000 * 1 + 3600000),
            is_ai_generated: true,
          },
          created_at: new Date(Date.now() - 86400000 * 1),
        },
        {
          custom_id: 'rev-103',
          customer_name: 'Rohan Verma',
          customer_phone: '+91 99100 88765',
          customer_email: 'rohan.verma@gmail.com',
          product_name: 'Bike QR Sticker — Shield Vinyl',
          rating: 4,
          review_text: 'Great quality print and very adhesive. Weather-proof in heavy monsoon rain so far. Wish there were more neon color choices for sport bikes.',
          status: 'published',
          reply: null,
          created_at: new Date(Date.now() - 86400000 * 2),
        },
        {
          custom_id: 'rev-104',
          customer_name: 'Vikram Malhotra',
          customer_phone: '+91 98450 11223',
          customer_email: 'vikram.m@rediffmail.com',
          product_name: 'Car QR Sticker — Standard',
          rating: 2,
          review_text: 'The sticker is good, but the courier took 5 days to reach Bengaluru. Please speed up delivery partner shipping times.',
          status: 'flagged',
          reply: {
            text: 'Apologies for the delay Vikram. We have partnered with Shiprocket Air express to cut delivery times down to 48 hours.',
            replied_at: new Date(Date.now() - 86400000 * 2),
            is_ai_generated: false,
          },
          created_at: new Date(Date.now() - 86400000 * 3),
        },
        {
          custom_id: 'rev-105',
          customer_name: 'Neha Kulkarni',
          customer_phone: '+91 97654 33211',
          customer_email: 'neha.k@icloud.com',
          product_name: 'Pet Tag QR — Stainless Steel',
          rating: 5,
          review_text: 'Super easy onboarding! Just scanned the QR code with my phone camera and entered OTP to activate. Family emergency contacts feature is wonderful.',
          status: 'published',
          reply: null,
          created_at: new Date(Date.now() - 86400000 * 4),
        },
        {
          custom_id: 'rev-106',
          customer_name: 'Siddharth Nair',
          customer_phone: '+91 98111 22334',
          customer_email: 'siddharth.n@gmail.com',
          product_name: 'Car QR Sticker — Ultra Gloss',
          rating: 1,
          review_text: 'Scratched the sticker while peeling the protective layer. Need a replacement sheet.',
          status: 'pending',
          reply: null,
          created_at: new Date(Date.now() - 86400000 * 5),
        },
      ];
      await Review.insertMany(seedDocs);
      logger.event('REVIEWS', '🌱', 'Default seed reviews populated in database');
    }
  } catch (seedErr) {
    logger.error('REVIEWS_SEED', 'Failed to seed default reviews', seedErr);
  }
}

class ReviewController {
  static async listReviews(req, res) {
    try {
      await ensureSeededReviews();

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
        customId: d.custom_id,
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

      const query = buildIdQuery(id);
      if (!query) {
        return res.status(400).json({ success: false, error: 'Invalid review ID' });
      }

      const updated = await Review.findOneAndUpdate(
        query,
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
      const query = buildIdQuery(id);
      const review = query ? await Review.findOne(query).lean() : null;
      if (!review) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      const customerName = review.customer_name || 'Customer';
      const productName = review.product_name || 'Car QR Sticker';
      const rating = review.rating || 5;

      let drafted = '';
      if (rating >= 4) {
        drafted = `Dear ${customerName}, thank you so much for the wonderful ${rating}-star review of the ${productName}! We're thrilled that our privacy protection and instant QR scanning are giving you peace of mind on the road.`;
      } else if (rating === 3) {
        drafted = `Hi ${customerName}, thank you for your candid feedback on the ${productName}. We're continuously refining our tags and dispatch workflows, and we'd love to make this a 5-star experience for you.`;
      } else {
        drafted = `Hello ${customerName}, we sincerely apologize that your experience with the ${productName} did not meet expectations. We take this very seriously and our support team would be delighted to send you a complimentary replacement right away.`;
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

      const query = buildIdQuery(id);
      if (!query) {
        return res.status(400).json({ success: false, error: 'Invalid review ID' });
      }

      const updated = await Review.findOneAndUpdate(
        query,
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
      if (!id) {
        return res.status(400).json({ success: false, error: 'Review ID is required' });
      }

      const query = buildIdQuery(id);
      let deleted = null;
      if (query) {
        deleted = await Review.findOneAndDelete(query).lean();
      }

      logger.event('REVIEWS', '🗑️', `Review ${id} deleted`);
      return res.json({ success: true, message: 'Review deleted successfully', deleted: Boolean(deleted) });
    } catch (err) {
      logger.error('REVIEWS_DELETE', 'Failed to delete review', err);
      return sendServerError(res, err);
    }
  }
}

module.exports = ReviewController;
