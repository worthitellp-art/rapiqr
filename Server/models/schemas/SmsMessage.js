const { Schema, model } = require('mongoose');

// Was Postgres `messages` table — service-role/admin-only access, never
// exposed to a non-admin or unauthenticated route (enforced by route wiring,
// same posture as the old RLS-enabled-with-no-public-policies table).
const smsMessageSchema = new Schema({
  created_at: { type: Date, default: Date.now, index: true },
  channel: { type: String, enum: ['sms', 'whatsapp'], required: true, index: true },
  to_number: { type: String, default: null },
  event: { type: String, default: null, index: true },
  status: { type: String, enum: ['sent', 'failed', 'simulated'], default: 'simulated', index: true },
  provider_sid: { type: String, default: null, index: true, sparse: true },
  error: { type: String, default: null },
  body_preview: { type: String, default: null },
}, { versionKey: false, collection: 'sms_messages' });

module.exports = model('SmsMessage', smsMessageSchema);
