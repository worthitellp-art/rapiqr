const { Schema, model } = require('mongoose');

const chatSessionSchema = new Schema({
  qr_code_id: { type: String, default: null, index: true },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  customer_token: { type: String, required: true },
  customer_name: { type: String, default: 'Visitor' },
  vehicle_label: { type: String, default: null },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  last_message_at: { type: Date, default: null },
  last_message_preview: { type: String, default: null },
  unread_owner_count: { type: Number, default: 0 },
  unread_customer_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

chatSessionSchema.index({ qr_code_id: 1, customer_token: 1, status: 1 });

module.exports = model('ChatSession', chatSessionSchema);
