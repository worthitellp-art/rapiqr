const { supabaseAdmin } = require('../config/db');

class QrModel {
  /**
   * Fetch QR codes list
   */
  static async getAll(limit = 100) {
    try {
      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .select('id, client_id, status, scans_count, last_scanned_at, template_name, fg_color, bg_color, created_at, activation_code')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('QrModel.getAll Error:', err);
      return [];
    }
  }

  /**
   * Fetch QR code by ID
   */
  static async getById(qrId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .select('*')
        .eq('id', qrId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`QrModel.getById (${qrId}) Error:`, err);
      return null;
    }
  }

  /**
   * Save or Update QR Code
   */
  static async save(qrData) {
    try {
      const payload = {
        id: qrData.id,
        client_id: qrData.clientId || qrData.client_id,
        status: qrData.status || 'unactivated',
        scans_count: qrData.scansCount || qrData.scans_count || 0,
        template_name: qrData.templateName || qrData.template_name || 'Standard Badge',
        fg_color: qrData.fgColor || qrData.fg_color || '#000000',
        bg_color: qrData.bgColor || qrData.bg_color || '#FFFFFF',
        activation_code: qrData.activationCode || qrData.activation_code || null,
        created_at: qrData.createdAt || qrData.created_at || new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('QrModel.save Error:', err);
      return null;
    }
  }

  /**
   * Activate QR Code
   * Also upserts a products record so the client dashboard shows the registered item
   */
  static async activate(qrId, activationData) {
    try {
      const payload = {
        status: 'active',
        activated_at: new Date().toISOString(),
        owner_name: activationData.visitorName || activationData.ownerName || 'Vehicle Owner',
        owner_message: activationData.visitorMessage || activationData.ownerMessage || ''
      };

      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .update(payload)
        .eq('id', qrId)
        .select()
        .single();

      if (error) throw error;

      // Mirror the frontend's activateQrInDb: create/update the product record
      if (activationData.ownerName || activationData.ownerPhone) {
        const productPayload = {
          qr_code_id: qrId,
          user_id: activationData.userId || activationData.user_id || null,
          name: activationData.ownerName || 'Vehicle Owner',
          status: 'active',
          assigned_to: activationData.ownerName || 'Vehicle Owner',
          details: {
            ownerPhone: activationData.ownerPhone || '',
            emergencyPhone: activationData.emergencyPhone || '',
            bloodGroup: activationData.bloodGroup || '',
            allergies: activationData.allergies || '',
            address: activationData.address || '',
            activatedAt: new Date().toISOString(),
          },
        };

        await supabaseAdmin
          .from('products')
          .upsert(productPayload, { onConflict: 'qr_code_id' });
      }

      return data;
    } catch (err) {
      console.error(`QrModel.activate (${qrId}) Error:`, err);
      return null;
    }
  }

  /**
   * Increment Scan Count
   */
  static async recordScan(qrId) {
    try {
      const current = await this.getById(qrId);
      const newCount = (current?.scans_count || 0) + 1;

      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .update({
          scans_count: newCount,
          last_scanned_at: new Date().toISOString()
        })
        .eq('id', qrId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`QrModel.recordScan (${qrId}) Error:`, err);
      return null;
    }
  }
}

module.exports = QrModel;
