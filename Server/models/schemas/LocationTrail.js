const { Schema, model } = require('mongoose');
const { RETENTION, toExpireAfterSeconds } = require('../../config/privacyConfig');

// One document per continuous live-location session for a sticker and visitor.
// The 5-second pings used to be one Alert row each; now they're points inside a
// single trail, so the admin list and history show one entry per session.
const locationPointSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracy: { type: Number, default: null },
  at: { type: Date, required: true },
}, { _id: false });

const locationTrailSchema = new Schema({
  sticker_id: { type: String, required: true, index: true },
  // The visitor's chat token (per sticker), so a session belongs to one visitor.
  visitor_key: { type: String, default: 'anonymous' },
  started_at: { type: Date, default: Date.now },
  last_at: { type: Date, default: Date.now },
  last_lat: { type: Number, default: null },
  last_lng: { type: Number, default: null },
  last_accuracy: { type: Number, default: null },
  count: { type: Number, default: 0 },
  // Only the most recent points are kept (see LocationTrailModel.recordPing).
  points: { type: [locationPointSchema], default: [] },
}, { versionKey: false });

locationTrailSchema.index({ sticker_id: 1, visitor_key: 1, last_at: -1 });
// Same retention as alerts — precise GPS, so it expires rather than living forever.
locationTrailSchema.index({ last_at: 1 }, { expireAfterSeconds: toExpireAfterSeconds(RETENTION.ALERT_RETENTION_DAYS) });

module.exports = model('LocationTrail', locationTrailSchema);
