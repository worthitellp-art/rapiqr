const { Schema, model } = require('mongoose');

// Was Postgres `reports`. Collapses the old separate qr_code_id/product_id
// (which pointed at the same row once qr_codes+products were merged into
// Sticker) into a single sticker_id reference.
const alertSchema = new Schema({
  sticker_id: { type: String, default: null, index: true },
  product_label: { type: String, default: 'RapiQR Item' },
  license_plate: { type: String, default: null },
  type: { type: String, default: 'contact_owner' },
  message: { type: String, default: null },
  reporter_phone: { type: String, default: null },
  location: { type: Schema.Types.Mixed, default: null },
  status: { type: String, default: 'unread' },
  created_at: { type: Date, default: Date.now, index: true },
}, { versionKey: false });

module.exports = model('Alert', alertSchema);
