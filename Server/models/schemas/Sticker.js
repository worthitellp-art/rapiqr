const { Schema, model } = require('mongoose');

// Merged collection: was two Postgres tables (qr_codes + products), 1:1 via
// products.qr_code_id, always read/written together — see migration plan.
const stickerSchema = new Schema({
  // crypto.randomUUID() — cryptographically random, unlike the old 6-character
  // Math.random()-based code, which had a small enough namespace (~17.6M
  // combinations) to make enumeration/guessing a real concern.
  _id: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'lost', 'replaced'], default: 'inactive' },
  // Plaintext recovery code for admin reference in the dashboard.
  recovery_code: { type: String, default: null },
  // SHA-256 hash of a server-generated recovery code, shown to the admin
  // exactly once at creation and never stored/retrievable in plaintext.
  // Proves possession of the physical sticker's printed backup code before
  // a soft-deleted record can be restored — see QrModel.restoreByRecoveryCode.
  recovery_code_hash: { type: String, default: null, select: false },
  // Soft delete: the admin "delete" action sets this instead of removing the
  // document, so the sticker's identity (and its recovery code hash) survive
  // for a later recovery-code-verified restore. Excluded from public/admin
  // listings by default.
  deleted_at: { type: Date, default: null, index: true },
  recovered_at: { type: Date, default: null },
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
  phone_number: { type: String, default: null, index: true },
  normalized_phone_number: { type: String, default: null, index: true },
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
}, { versionKey: false });

const { normalizePhone } = require('../../utils/phone');

stickerSchema.pre('save', function(next) {
  if (this.phone_number) {
    this.normalized_phone_number = normalizePhone(this.phone_number);
  } else {
    this.normalized_phone_number = null;
  }
  next();
});

stickerSchema.index({ created_at: -1 });
stickerSchema.index({ user_id: 1 });
stickerSchema.index({ 'details.ownerPhone': 1 });
stickerSchema.index({ category: 1, normalized_phone_number: 1 }, { unique: true, sparse: true });

module.exports = model('Sticker', stickerSchema);
