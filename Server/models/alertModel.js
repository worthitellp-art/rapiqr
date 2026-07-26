const { supabaseAdmin } = require('../config/db');

class AlertModel {
  /**
   * Log an Emergency / Parking alert
   */
  static async createAlert(alertPayload) {
    try {
      const payload = {
        qr_id: alertPayload.qrId || alertPayload.qr_id,
        qr_url: alertPayload.qrUrl || alertPayload.qr_url,
        latitude: alertPayload.latitude,
        longitude: alertPayload.longitude,
        accuracy: alertPayload.accuracy,
        device_id: alertPayload.deviceId || alertPayload.device_id,
        message: alertPayload.message || 'Emergency Alert',
        vehicle_name: alertPayload.vehicleName || alertPayload.vehicle_name,
        vehicle_number: alertPayload.vehicleNumber || alertPayload.vehicle_number,
        status: alertPayload.status || 'sent',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('alerts')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('AlertModel.createAlert Error:', err);
      // Fallback object if table does not exist
      return {
        id: Date.now(),
        ...alertPayload,
        status: 'sent',
        created_at: new Date().toISOString()
      };
    }
  }

  /**
   * Get Alerts List
   */
  static async getAlerts(limit = 50) {
    try {
      const { data, error } = await supabaseAdmin
        .from('alerts')
        .select('*')
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
