const { Schema, model } = require('mongoose');

const shopProductSchema = new Schema({
  name: { type: String, default: null },
  category: { type: String, default: null },
  badge: { type: String, default: null },
  description: { type: String, default: null },
  features: { type: [String], default: [] },
  price: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  image_url: { type: String, default: null },
  rating: { type: Number, default: 0 },
  reviews_count: { type: Number, default: 0 },
  sku: { type: String, default: null },
  weight_grams: { type: Number, default: null },
  length_cm: { type: Number, default: null },
  breadth_cm: { type: Number, default: null },
  height_cm: { type: Number, default: null },
  is_active: { type: Boolean, default: true, index: true },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = model('ShopProduct', shopProductSchema);
