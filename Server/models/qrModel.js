const { supabaseAdmin } = require('../config/db');

class QrModel {
  /**
   * Fetch QR codes list
   */
  static async getAll(limit = 100) {
    try {
      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .select('id, client_id, status, scans_count, last_scanned_at, template_name, fg_color, bg_color, sticker_image, category, created_at, activation_code')
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
   * Save or Update QR Code record (including sticker image and colors)
   */
  static async save(qrData) {
    try {
      const payload = {
        id: qrData.id,
        client_id: qrData.clientId || qrData.client_id || qrData.id || 'UNASSIGNED',
        status: qrData.status || 'inactive',
        scans_count: qrData.scansCount || qrData.scans_count || 0,
        template_name: qrData.templateName || qrData.template_name || 'Standard Badge',
        category: qrData.category || 'car',
        fg_color: qrData.fgColor || qrData.fg_color || 'D9581F',
        bg_color: qrData.bgColor || qrData.bg_color || 'FFFFFF',
        sticker_image: qrData.stickerImage || qrData.sticker_image || null,
        activation_code: qrData.activationCode || qrData.activation_code || null,
        created_at: qrData.createdAt || qrData.created_at || new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('QrModel.save Error:', err);
      return null;
    }
  }

  /**
   * Save the generated sticker image URL for a QR code
   */
  static async saveStickerImage(qrId, stickerImage) {
    try {
      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .update({ sticker_image: stickerImage })
        .eq('id', qrId)
        .select('id, sticker_image')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`QrModel.saveStickerImage (${qrId}) Error:`, err);
      return null;
    }
  }

  /**
   * Activate QR Code
   * Updates qr_codes status to active and upserts a products record
   */
  static async activate(qrId, activationData) {
    // Intentionally does not catch-and-return-null like the other methods here:
    // a swallowed error here previously let the controller report success:true
    // on a failed write (task.md #4/#13/#14) — real failures must propagate.
    const payload = {
      status: 'active'
    };

    const { data, error } = await supabaseAdmin
      .from('qr_codes')
      .update(payload)
      .eq('id', qrId)
      .select()
      .single();

    if (error) throw error;

    // Upsert product record for user dashboard
    if (activationData.ownerName || activationData.ownerPhone) {
      const productPayload = {
        qr_code_id: qrId,
        user_id: activationData.userId || activationData.user_id || null,
        category: activationData.category || data?.category || 'car',
        name: activationData.ownerName || 'Vehicle Owner',
        status: 'active',
        assigned_to: activationData.ownerName || 'Vehicle Owner',
        details: {
          ownerPhone: activationData.ownerPhone || '',
          ownerEmail: activationData.ownerEmail || '',
          emergencyContacts: activationData.emergencyContacts || [],
          bloodGroup: activationData.bloodGroup || '',
          allergies: activationData.allergies || '',
          address: activationData.address || '',
          activatedAt: new Date().toISOString(),
        },
      };

      const { error: productError } = await supabaseAdmin
        .from('products')
        .upsert(productPayload, { onConflict: 'qr_code_id' });

      if (productError) throw productError;
    }

    return data;
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
