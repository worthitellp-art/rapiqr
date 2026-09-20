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
  country: { type: String, default: null },
  notes: { type: String, default: null },
  // Structured coverage/availability, collected by the "Join us" partner
  // onboarding flow so a future matching system can query on them directly
  // instead of parsing free-text notes.
  whatsapp: { type: String, default: null },
  years_experience: { type: String, default: null },
  radius_km: { type: Number, default: null },
  service_areas: { type: [{ name: String, radius_km: Number, _id: false }], default: [] },
  availability: { type: Schema.Types.Mixed, default: null },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

communicationSchema.index({ categories: 1 });

module.exports = model('Communication', communicationSchema);
