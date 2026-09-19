const { Schema, model } = require('mongoose');

const serverLogSchema = new Schema({
  created_at: { type: Date, default: Date.now },
  level: { type: String, default: null, index: true },
  tag: { type: String, default: null, index: true },
  category: { type: String, default: null, index: true },
  event: { type: String, default: null },
  // Mixed: may be a real User ObjectId, or an unauthenticated-caller marker.
  user_id: { type: Schema.Types.Mixed, default: null, index: true },
  request_id: { type: String, default: null, index: true },
  service: { type: String, default: null },
  message: { type: String, default: null },
  details: { type: Schema.Types.Mixed, default: null },
  resource_id: { type: String, default: null },
  method: { type: String, default: null },
  url: { type: String, default: null },
  status_code: { type: Number, default: null },
  duration_ms: { type: Number, default: null },
  origin: { type: String, default: null },
  ip: { type: String, default: null },
  status: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: null },
}, { versionKey: false });

// Hot retention: Retain operational server logs for 30 days
serverLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 86400 * 30 });

module.exports = model('ServerLog', serverLogSchema);
