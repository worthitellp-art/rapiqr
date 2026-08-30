const { Schema, model } = require('mongoose');

const chatMessageSchema = new Schema({
  session_id: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true },
  sender_type: { type: String, enum: ['owner', 'customer'], required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  body: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  read_at: { type: Date, default: null },
  delivered_at: { type: Date, default: null },
  attachment_url: { type: String, default: null },
  attachment_type: { type: String, default: null },
  attachment_name: { type: String, default: null },
  attachment_width: { type: Number, default: null },
  attachment_height: { type: Number, default: null },
}, { versionKey: false });

chatMessageSchema.index({ session_id: 1, created_at: 1 });

module.exports = model('ChatMessage', chatMessageSchema);
