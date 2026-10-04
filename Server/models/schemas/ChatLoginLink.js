const { Schema, model } = require('mongoose');

// Login links carried in WhatsApp chat buttons. Only the SHA-256 hash of the
// token is stored, so a database read cannot be replayed as a login.
// `expires_at` is set to a long unopened lifetime at creation, then shortened
// to a 10-minute window from the first tap (`opened_at`). Rows are removed by
// the TTL index once they expire.
const chatLoginLinkSchema = new Schema({
  token_hash: { type: String, required: true, unique: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  session_id: { type: String, required: true },
  expires_at: { type: Date, required: true, index: { expires: 0 } },
  opened_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false, collection: 'chat_login_links' });

module.exports = model('ChatLoginLink', chatLoginLinkSchema);
