const { supabaseAdmin } = require('../config/db');

class AlertModel {
  /**
   * Log an Emergency / Parking alert into the reports table
   * (matches the frontend's supabaseService.createReportInDb contract)
   */
  static async createAlert(alertPayload) {
    try {
      const payload = {
        qr_code_id: alertPayload.qrId || alertPayload.qr_code_id || alertPayload.vehicleId || null,
        product_id: alertPayload.productId || alertPayload.product_id || null,
        product_label: alertPayload.productLabel || alertPayload.product_label || alertPayload.vehicleLabel || 'RapiQR Item',
        license_plate: alertPayload.licensePlate || alertPayload.license_plate || null,
        type: alertPayload.type || 'contact_owner',
        message: alertPayload.message || '',
        reporter_phone: alertPayload.reporterPhone || alertPayload.reporter_phone || null,
        location: alertPayload.location || null,
        status: alertPayload.status || 'unread',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('reports')
        .insert(payload)
        .select('id, qr_code_id, status, created_at')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('AlertModel.createAlert Error:', err);
      // Do not fabricate a fake success object here — this is the emergency SOS
      // alert path, and a caller/reporter must know the alert was NOT actually
      // saved so the UI can tell them to retry (task.md #13).
      throw err;
    }
  }

  /**
   * Get Alerts Log (reports table)
   */
  static async getAlerts(limit = 50) {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .select('id, qr_code_id, product_id, product_label, license_plate, type, message, reporter_phone, location, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('AlertModel.getAlerts Error:', err);
      return [];
    }
  }
}

module.exports = AlertModel;
