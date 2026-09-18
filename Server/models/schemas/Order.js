const { Schema, model } = require('mongoose');

const orderSchema = new Schema({
  // App-generated '#NQ-XXXXXX' reference number — not an ObjectId.
  _id: { type: String },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, default: null },
  email: { type: String, default: null },
  phone: { type: String, default: null },
  items: { type: [Schema.Types.Mixed], default: [] },
  subtotal: { type: Number, default: 0 },
  delivery_fee: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  payment_method: { type: String, default: 'upi' },
  delivery_method: { type: String, default: 'standard' },
  status: { type: String, default: 'pending' },
  shipping_address: { type: Schema.Types.Mixed, default: null },
  payment: { type: Schema.Types.Mixed, default: null },
  // Promoted out of payment.razorpayOrderId (was a JSON-path filter in
  // Postgres) so it can be a plain indexed field.
  razorpayOrderId: { type: String, default: null, index: true },
  shiprocket: { type: Schema.Types.Mixed, default: null },
  // Promoted out of shiprocket.awbCode, same reason.
  awbCode: { type: String, default: null, index: true },
  // One entry per physical sticker this order is owed, auto-minted once
  // payment clears (OrderModel.generateStickersForOrder) so an admin never
  // has to hand-generate a QR tag for a paid order. Empty until then.
  stickers: { type: [Schema.Types.Mixed], default: [] },
  // Atomic claim flag so a browser /verify call racing the Razorpay webhook
  // (both can observe the same paid transition) can't both mint a batch of
  // stickers for the same order — see OrderModel.generateStickersForOrder.
  stickers_generation_started: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
}, { _id: false, versionKey: false });

orderSchema.index({ status: 1 });
orderSchema.index({ user_id: 1 });

module.exports = model('Order', orderSchema);
