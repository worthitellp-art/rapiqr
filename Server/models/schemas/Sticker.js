const { Schema, model } = require('mongoose');

// Merged collection: was two Postgres tables (qr_codes + products), 1:1 via
// products.qr_code_id, always read/written together — see migration plan.
const stickerSchema = new Schema({
  // The sticker code itself (printed on the physical sticker, used in
  // /scan/:id) — not an auto-generated ObjectId.
  _id: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'lost', 'replaced'], default: 'inactive' },
  scans_count: { type: Number, default: 0 },
  last_scanned_at: { type: Date, default: null },
  template_name: { type: String, default: 'Standard Badge' },
  fg_color: { type: String, default: 'D9581F' },
  bg_color: { type: String, default: 'FFFFFF' },
  // No stored sticker image: the composited sticker graphic is a pure function
  // of (id, fg_color, bg_color, template placement) and is regenerated
  // on-demand client-side wherever it's needed — nothing to store, nothing to lose.
  category: { type: String, default: 'car' },
  // Legacy secondary ownership pointer, carried over as-is (now redundant
  // with user_id on the same document, but kept for compatibility).
  client_id: { type: String, default: 'UNASSIGNED' },

  user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, default: null },
  assigned_to: { type: String, default: null },
  vehicle_number: { type: String, default: null },
  details: {
    address: { type: String, default: null },
    bloodGroup: { type: String, default: null },
    allergies: { type: String, default: null },
    ownerPhone: { type: String, default: null },
    ownerEmail: { type: String, default: null },
    notes: { type: String, default: null },
    emergencyContacts: {
      type: [{ name: String, phone: String, _id: false }],
      default: [],
    },
    activatedAt: { type: Date, default: null },
  },
  created_at: { type: Date, default: Date.now },
}, { _id: false, versionKey: false });

stickerSchema.index({ created_at: -1 });
stickerSchema.index({ user_id: 1 });
stickerSchema.index({ 'details.ownerPhone': 1 });

module.exports = model('Sticker', stickerSchema);
