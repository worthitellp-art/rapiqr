const { Schema, model } = require('mongoose');

// Merged collection: was two Postgres tables (qr_codes + products), 1:1 via
// products.qr_code_id, always read/written together — see migration plan.
const stickerSchema = new Schema({
  // v1 (id_scheme_version 1, the default): crypto.randomUUID() — cryptographically
  // random, unlike the old 6-character Math.random()-based code, which had a
  // small enough namespace (~17.6M combinations) to make enumeration/guessing
  // a real concern. Independent of recovery_code; the two are linked only by
  // this row.
  // v2 (id_scheme_version 2): _id = HMAC-SHA256(recovery_code, ...) — see
  // Server/services/stickerCrypto.js. The id is a deterministic, one-way
  // function of the recovery code, so it's recomputable from the code alone
  // with no dependency on this row surviving. New issuance only; v1 stickers
  // already printed in the field keep working exactly as before.
  _id: { type: String },
  // Which derivation scheme produced this sticker's _id/recovery_code
  // relationship. Never recompute an existing sticker's id under a newer
  // scheme — a version bump only changes how FUTURE stickers are issued.
  id_scheme_version: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'inactive', 'lost', 'replaced'], default: 'inactive' },
  // Plaintext recovery code for admin reference in the dashboard.
  recovery_code: { type: String, default: null },
  // SHA-256 hash of a server-generated recovery code, shown to the admin
  // exactly once at creation and never stored/retrievable in plaintext.
  // Proves possession of the physical sticker's printed backup code before
  // a soft-deleted record can be restored — see QrModel.restoreByRecoveryCode.
  // For v2 stickers this is defense-in-depth only (the id-derivation lookup
  // already proves possession) — see stickerCrypto.js's hashRecoveryCodeV2.
  recovery_code_hash: { type: String, default: null, select: false },
  // ── v2-only: pinned QR generation parameters (Server/services/qrPinning.js) ──
  // Exact literal string encoded into the QR, stored verbatim rather than
  // rebuilt from the current APP_URL — a later domain/config change must
  // never alter what an already-printed sticker decodes to.
  qr_payload: { type: String, default: null },
  // Explicit per ISO/IEC 18004 so the QR bit matrix is reproducible by ANY
  // spec-compliant encoder, forever — never re-derive these via "auto" once set.
  qr_version: { type: Number, default: null },
  qr_ecc_level: { type: String, enum: ['L', 'M', 'Q', 'H', null], default: null },
  qr_mask_pattern: { type: Number, min: 0, max: 7, default: null },
  module_size_px: { type: Number, default: null },
  margin_modules: { type: Number, default: null },
  // Exact pinned encoder identity used to render this sticker — a future
  // library bump renders new stickers with a new encoder_version; old
  // stickers are never silently re-rendered with it.
  encoder_name: { type: String, default: null },
  encoder_version: { type: String, default: null },
  // SHA-256 of the canonical rendered PNG at issuance — the tripwire every
  // regeneration re-checks against (see QrModel.recoverByCodeV2). A mismatch
  // means the pinned encoder produced different bytes than at issuance and
  // must hard-fail rather than silently serve a "close enough" image.
  rendered_image_sha256: { type: String, default: null },
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

// Mongoose 9 dropped the callback-style `next` argument for hooks — a
// function declaring it no longer receives one, so calling it throws
// "next is not a function" and the save rejects. This hook is synchronous
// (no I/O), so the fix is just not taking/calling `next`: Mongoose treats a
// hook that returns undefined as done as soon as it returns.
stickerSchema.pre('save', function() {
  if (this.phone_number) {
    this.normalized_phone_number = normalizePhone(this.phone_number);
  } else {
    this.normalized_phone_number = null;
  }
});

stickerSchema.index({ created_at: -1 });
stickerSchema.index({ user_id: 1 });
stickerSchema.index({ 'details.ownerPhone': 1 });
// Unique phone per category among LIVE (non-deleted) stickers only. Soft-delete
// frees the (category, phone) slot, so a deleted tag's phone can be reused and a
// restored tag re-checks for conflicts (see restoreByRecoveryCode).
stickerSchema.index(
  { category: 1, normalized_phone_number: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null, normalized_phone_number: { $type: 'string' } } }
);

module.exports = model('Sticker', stickerSchema);
