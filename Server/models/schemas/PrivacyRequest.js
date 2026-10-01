const { Schema, model } = require('mongoose');

// Data-principal request workflow (task.md §26). Currently used for ERASURE
// and EXPORT requests — ACCESS/CORRECTION/UPDATE are handled synchronously via
// GET/PATCH /api/privacy/me and don't need a tracked workflow of their own.
const STATUSES = Object.freeze([
  'REQUESTED',
  'IDENTITY_VERIFIED',
  'PROCESSING',
  'DATA_COLLECTED',
  'REVIEW',
  'FULFILLED',
  'REJECTED_WITH_REASON',
]);

const privacyRequestSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['ERASURE', 'EXPORT'], required: true, index: true },
  status: { type: String, enum: STATUSES, default: 'REQUESTED', index: true },
  reason: { type: String, default: null },
  requested_at: { type: Date, default: Date.now },
  identity_verified_at: { type: Date, default: null },
  fulfilled_at: { type: Date, default: null },
  notes: { type: String, default: null },
}, { versionKey: false });

module.exports = model('PrivacyRequest', privacyRequestSchema);
module.exports.STATUSES = STATUSES;
