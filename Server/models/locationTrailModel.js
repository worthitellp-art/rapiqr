const LocationTrail = require('./schemas/LocationTrail');
const Sticker = require('./schemas/Sticker');
const { registeredName } = require('../utils/stickerNames');
const { logger } = require('../middleware/loggerMiddleware');

/** A pause longer than this starts a new trail for the same visitor and sticker. */
const TRAIL_GAP_MS = 15 * 60 * 1000;
/** Points kept per trail; the count keeps growing past this. */
const MAX_POINTS = 500;

const SUMMARY_FIELDS = 'sticker_id visitor_key started_at last_at last_lat last_lng last_accuracy count';

function summaryToApi(d) {
  return {
    id: String(d._id),
    sticker_id: d.sticker_id,
    started_at: d.started_at,
    last_at: d.last_at,
    last_lat: d.last_lat,
    last_lng: d.last_lng,
    last_accuracy: d.last_accuracy,
    count: d.count,
  };
}

class LocationTrailModel {
  /**
   * Adds one live-location fix to the visitor's current trail, or starts a new one
   * after a long pause. One upsert per fix, so a 5-second ping is a single write.
   */
  static async recordPing({ stickerId, visitorKey, lat, lng, accuracy = null, at = new Date() }) {
    const when = at instanceof Date ? at : new Date(at);
    const key = visitorKey ? String(visitorKey) : 'anonymous';
    const since = new Date(when.getTime() - TRAIL_GAP_MS);
    const point = { lat, lng, accuracy, at: when };

    const doc = await LocationTrail.findOneAndUpdate(
      { sticker_id: String(stickerId), visitor_key: key, last_at: { $gte: since } },
      {
        $push: { points: { $each: [point], $slice: -MAX_POINTS } },
        $set: { last_at: when, last_lat: lat, last_lng: lng, last_accuracy: accuracy },
        $inc: { count: 1 },
        $setOnInsert: { started_at: when },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('_id').lean();

    return { id: String(doc._id) };
  }

  /** Trail summaries (no points) for the admin list, newest first. */
  static async listSummaries({ from = null, to = null, limit = 200, stickerIds = null } = {}) {
    try {
      const filter = {};
      if (stickerIds) filter.sticker_id = { $in: stickerIds };
      if (from || to) {
        filter.last_at = {};
        if (from) filter.last_at.$gte = from;
        if (to) filter.last_at.$lt = to;
      }
      const docs = await LocationTrail.find(filter).select(SUMMARY_FIELDS).sort({ last_at: -1 }).limit(limit).lean();

      // The registered name for each sticker, looked up once per list.
      const ids = [...new Set(docs.map((d) => d.sticker_id))];
      const stickers = ids.length ? await Sticker.find({ _id: { $in: ids } }).select('name assigned_to').lean() : [];
      const nameById = new Map(
        stickers.map((s) => [String(s._id), registeredName(s.name) || registeredName(s.assigned_to)])
      );
      return docs.map((d) => ({ ...summaryToApi(d), sticker_name: nameById.get(d.sticker_id) || null }));
    } catch (err) {
      logger.error('DB_TRAIL', 'LocationTrailModel.listSummaries failed', err);
      return [];
    }
  }

  /** One trail with its recent points, for the expanded row. */
  static async getById(id) {
    try {
      const doc = await LocationTrail.findById(id).lean();
      if (!doc) return null;
      return {
        ...summaryToApi(doc),
        points: (doc.points || []).map((p) => ({ lat: p.lat, lng: p.lng, accuracy: p.accuracy, at: p.at })),
      };
    } catch (err) {
      logger.error('DB_TRAIL', `LocationTrailModel.getById failed (${id})`, err);
      return null;
    }
  }
}

module.exports = LocationTrailModel;
