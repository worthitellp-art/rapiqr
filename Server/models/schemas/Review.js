const { Schema, model } = require('mongoose');

const reviewSchema = new Schema({
  custom_id: { type: String, default: null, index: true },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, default: null },
  customer_email: { type: String, default: null },
  product_name: { type: String, default: 'Car QR Sticker' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String, required: true },
  status: { type: String, enum: ['published', 'flagged', 'pending'], default: 'published', index: true },
  reply: {
    text: { type: String, default: null },
    replied_at: { type: Date, default: null },
    is_ai_generated: { type: Boolean, default: false },
  },
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = model('Review', reviewSchema);
