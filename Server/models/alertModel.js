const Alert = require('./schemas/Alert');
const Sticker = require('./schemas/Sticker');
const { registeredName } = require('../utils/stickerNames');
const { logger } = require('../middleware/loggerMiddleware');

class AlertModel {
  /**
   * Log an Emergency / Parking alert (matches the frontend's
   * supabaseService.createReportInDb contract). `sticker_id` collapses the
   * old separate qr_code_id/product_id — see the Alert schema note.
   */
  static async createAlert(alertPayload) {
    try {
      const stickerId = alertPayload.productId || alertPayload.product_id
        || alertPayload.qrId || alertPayload.qr_code_id || alertPayload.vehicleId || null;

      // Every scan-page call site sends flat latitude/longitude/accuracy
      // fields (never a pre-built `location` object) — this was previously
      // read as `alertPayload.location` only, so real GPS coordinates the
      // visitor's browser had already captured were silently discarded and
      // every alert was saved with location: null. Build it from whichever
      // shape the caller sent.
      const location = alertPayload.location || (
        alertPayload.latitude != null && alertPayload.longitude != null
          ? {
              lat: alertPayload.latitude,
              lng: alertPayload.longitude,
              accuracy: alertPayload.accuracy ?? null,
              timestamp: alertPayload.timestamp || new Date().toISOString(),
            }
          : null
      );

      const doc = await Alert.create({
        sticker_id: stickerId,
        product_label: alertPayload.productLabel || alertPayload.product_label || alertPayload.vehicleLabel || 'RapiQR Item',
        license_plate: alertPayload.licensePlate || alertPayload.license_plate || null,
        type: alertPayload.type || 'contact_owner',
        message: alertPayload.message || '',
        reporter_phone: alertPayload.reporterPhone || alertPayload.reporter_phone || null,
        location,
        status: alertPayload.status || 'unread',
      });

      return { id: String(doc._id), qr_code_id: doc.sticker_id, status: doc.status, created_at: doc.created_at };
    } catch (err) {
      console.error('AlertModel.createAlert Error:', err);
      logger.error('DB_ALERT', 'AlertModel.createAlert failed', err);
      // Do not fabricate a fake success object here — this is the emergency SOS
      // alert path, and a caller/reporter must know the alert was NOT actually
      // saved so the UI can tell them to retry (task.md #13).
      throw err;
    }
  }

  /**
   * Get Alerts Log
   */
  static async getAlerts(limit = 50, { type = null } = {}) {
    try {
      // Live-location pings aren't alerts any more — they live in location trails.
      // A `type` narrows the list (the Communication tab asks for service requests).
      const filter = type ? { type } : { type: { $ne: 'location_ping' } };
      const docs = await Alert.find(filter).sort({ created_at: -1 }).limit(limit).lean();

      // The registered name lives on the sticker, not the alert, so look up each
      // alerted sticker once and attach its name (null when there isn't one).
      const stickerIds = [...new Set(docs.map((d) => d.sticker_id).filter(Boolean))];
      const stickers = stickerIds.length
        ? await Sticker.find({ _id: { $in: stickerIds } }).select('name assigned_to').lean()
        : [];
      const nameById = new Map(
        stickers.map((s) => [String(s._id), registeredName(s.name) || registeredName(s.assigned_to)])
      );

      return docs.map((d) => ({
        id: String(d._id),
        qr_code_id: d.sticker_id,
        product_id: d.sticker_id,
        sticker_name: nameById.get(d.sticker_id) || null,
        product_label: d.product_label,
        license_plate: d.license_plate,
        type: d.type,
        message: d.message,
        reporter_phone: d.reporter_phone,
        location: d.location,
        status: d.status,
        created_at: d.created_at,
      }));
    } catch (err) {
      console.error('AlertModel.getAlerts Error:', err);
      logger.error('DB_ALERT', 'AlertModel.getAlerts failed', err);
      return [];
    }
  }

  /**
   * Alerts filed against a specific set of sticker ids — used by the
   * /api/privacy/export data export to include alerts tied to stickers the
   * requesting user owns (their emergency-contact/visitor-report history),
   * without exposing alerts filed against anyone else's stickers.
   */
  static async getByStickerIds(stickerIds) {
    try {
      if (!Array.isArray(stickerIds) || stickerIds.length === 0) return [];
      const docs = await Alert.find({ sticker_id: { $in: stickerIds } }).sort({ created_at: -1 }).lean();
      return docs.map((d) => ({
        id: String(d._id),
        stickerId: d.sticker_id,
        type: d.type,
        message: d.message,
        reporterPhone: d.reporter_phone,
        location: d.location,
        status: d.status,
        createdAt: d.created_at,
      }));
    } catch (err) {
      console.error('AlertModel.getByStickerIds Error:', err);
      logger.error('DB_ALERT', 'AlertModel.getByStickerIds failed', err);
      return [];
    }
  }

  /** A service inquiry already filed for this sticker with the same wording since `since`. */
  static async findRecentServiceInquiry(stickerId, message, since) {
    try {
      const doc = await Alert.findOne({
        type: 'service_inquiry',
        sticker_id: stickerId,
        message,
        created_at: { $gte: since },
      }).lean();
      return Boolean(doc);
    } catch (err) {
      logger.error('DB_ALERT', 'AlertModel.findRecentServiceInquiry failed', err);
      return false;
    }
  }

  /**
   * Delete all alerts from the database
   */
  static async deleteAllAlerts() {
    try {
      const result = await Alert.deleteMany({});
      return { deletedCount: result.deletedCount || 0 };
    } catch (err) {
      console.error('AlertModel.deleteAllAlerts Error:', err);
      logger.error('DB_ALERT', 'AlertModel.deleteAllAlerts failed', err);
      throw err;
    }
  }

  /**
   * Delete single alert by ID
   */
  static async deleteAlert(id) {
    try {
      const result = await Alert.findByIdAndDelete(id);
      return { success: Boolean(result) };
    } catch (err) {
      console.error('AlertModel.deleteAlert Error:', err);
      logger.error('DB_ALERT', 'AlertModel.deleteAlert failed', err);
      throw err;
    }
  }

  /**
   * Mark alert as resolved
   */
  static async resolveAlert(id) {
    try {
      const result = await Alert.findByIdAndUpdate(id, { $set: { status: 'resolved' } }, { new: true });
      return { success: Boolean(result), data: result };
    } catch (err) {
      console.error('AlertModel.resolveAlert Error:', err);
      logger.error('DB_ALERT', 'AlertModel.resolveAlert failed', err);
      throw err;
    }
  }
}

module.exports = AlertModel;
