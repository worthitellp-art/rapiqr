const { Schema, model } = require('mongoose');

const communicationSchema = new Schema({
  category: { type: String, default: null, index: true },
  label: { type: String, default: null },
  phone: { type: String, default: null },
  active: { type: Boolean, default: true, index: true },
  service_type: { type: String, default: null, index: true },
  categories: { type: [String], default: [] },
  email: { type: String, default: null },
  city: { type: String, default: null },
  notes: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

communicationSchema.index({ categories: 1 });

module.exports = model('Communication', communicationSchema);
