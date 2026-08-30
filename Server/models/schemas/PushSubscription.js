const { Schema, model } = require('mongoose');

// One browser/device registration for Web Push. A user can have several
// (phone + laptop + a second browser), so this is many-per-user, not 1:1.
const pushSubscriptionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = model('PushSubscription', pushSubscriptionSchema);
