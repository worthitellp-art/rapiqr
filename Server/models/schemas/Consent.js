const { Schema, model } = require('mongoose');

// Purpose-specific consent record (DPDP Act §6 — consent must be free, specific,
// informed, unconditional, unambiguous, and given by clear affirmative action).
// One document per grant/withdraw event, not one row per user — so the history
// of what was agreed to, when, and under which notice version is preserved
// rather than overwritten. "Current status for purpose X" = latest document
// for that (user_id, purpose) pair, ordered by created_at.
//
// PURPOSES intentionally excludes anything that's actually "necessary for the
// specified service the user asked for" (task.md §7) — e.g. sticker activation,
// emergency alerts, OTP delivery — those are SERVICE-basis processing, not
// consent-gated, and must not be bundled into a consent checkbox here.
const PURPOSES = Object.freeze([
  'marketing_communications', // optional promotional email/SMS/WhatsApp
  'push_notifications', // optional web-push opt-in (browser permission is the
                         // affirmative action; this is the DPDP-facing record of it)
]);

const consentSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purpose: { type: String, enum: PURPOSES, required: true, index: true },
  data_categories: { type: [String], default: [] },
  notice_version: { type: String, required: true },
  status: { type: String, enum: ['GRANTED', 'WITHDRAWN'], required: true, index: true },
  source: { type: String, default: 'privacy_dashboard' },
  // Only stored when the caller is authenticated and the field is genuinely
  // useful for a fraud/dispute investigation — never required, never used to
  // identify the person on its own (task.md §6: "only where justified").
  ip_address: { type: String, default: null },
  created_at: { type: Date, default: Date.now, index: true },
}, { versionKey: false });

consentSchema.index({ user_id: 1, purpose: 1, created_at: -1 });

module.exports = model('Consent', consentSchema);
module.exports.PURPOSES = PURPOSES;
