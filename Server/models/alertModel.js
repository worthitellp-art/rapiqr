const Alert = require('./schemas/Alert');

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

      const doc = await Alert.create({
        sticker_id: stickerId,
        product_label: alertPayload.productLabel || alertPayload.product_label || alertPayload.vehicleLabel || 'RapiQR Item',
        license_plate: alertPayload.licensePlate || alertPayload.license_plate || null,
        type: alertPayload.type || 'contact_owner',
        message: alertPayload.message || '',
        reporter_phone: alertPayload.reporterPhone || alertPayload.reporter_phone || null,
        location: alertPayload.location || null,
        status: alertPayload.status || 'unread',
      });

      return { id: String(doc._id), qr_code_id: doc.sticker_id, status: doc.status, created_at: doc.created_at };
    } catch (err) {
      console.error('AlertModel.createAlert Error:', err);
      // Do not fabricate a fake success object here — this is the emergency SOS
      // alert path, and a caller/reporter must know the alert was NOT actually
      // saved so the UI can tell them to retry (task.md #13).
      throw err;
    }
  }

  /**
   * Get Alerts Log
   */
  static async getAlerts(limit = 50) {
    try {
      const docs = await Alert.find().sort({ created_at: -1 }).limit(limit).lean();
      return docs.map((d) => ({
        id: String(d._id),
        qr_code_id: d.sticker_id,
        product_id: d.sticker_id,
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
      return [];
    }
  }
}

module.exports = AlertModel;
