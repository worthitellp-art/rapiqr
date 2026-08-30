const { Schema, model } = require('mongoose');

const distributorApplicationSchema = new Schema({
  // App-generated 'DIST-XXXXXX' reference number — not an ObjectId.
  _id: { type: String },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  user_name: { type: String, default: null },
  user_email: { type: String, default: null, index: true },
  phone: { type: String, default: null, index: true },
  city: { type: String, default: null },
  business: { type: String, default: null },
  tier: { type: String, default: null },
  status: { type: String, default: 'pending' },
  notes: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  approved_at: { type: Date, default: null },
}, { _id: false, versionKey: false });

module.exports = model('DistributorApplication', distributorApplicationSchema);
