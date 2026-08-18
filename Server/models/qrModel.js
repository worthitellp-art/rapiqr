const { supabaseAdmin } = require('../config/db');

class QrModel {
  /**
   * Fetch QR codes list
   */
  static async getAll(limit = 100) {
    try {
      // Embeds the linked products row (via the qr_code_id FK) so the admin
      // fleet view can show the owner phone/name a client registered on
      // activation — previously this only selected qr_codes columns, so the
      // admin dashboard could never see who a sticker belonged to.
      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .select('id, client_id, status, scans_count, last_scanned_at, template_name, fg_color, bg_color, sticker_image, category, created_at, products(name, assigned_to, status, details)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((row) => {
        const product = Array.isArray(row.products) ? row.products[0] : row.products;
        const { products, ...rest } = row;
        return {
          ...rest,
          owner_phone: product?.details?.ownerPhone || null,
          owner_email: product?.details?.ownerEmail || null,
          owner_name: product?.name || product?.assigned_to || null,
          product_status: product?.status || null,
        };
      });
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

  /**
   * Delete QR Code record and everything that references it.
   * chat_sessions/chat_messages and reports (alerts) hold a qr_code_id FK with no
   * ON DELETE CASCADE, so deleting qr_codes first throws a foreign-key violation —
   * this used to be caught and swallowed (returning null), which let the controller
   * report success:true while the row was never actually removed from Supabase.
   * Errors here now propagate so the caller gets a real failure instead of a lie.
   */
  static async delete(qrId) {
    const { data: sessions, error: sessionsFetchError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .eq('qr_code_id', qrId);
    if (sessionsFetchError) throw sessionsFetchError;

    const sessionIds = (sessions || []).map((s) => s.id);
    if (sessionIds.length > 0) {
      const { error: messagesError } = await supabaseAdmin.from('chat_messages').delete().in('session_id', sessionIds);
      if (messagesError) throw messagesError;
      const { error: sessionsError } = await supabaseAdmin.from('chat_sessions').delete().eq('qr_code_id', qrId);
      if (sessionsError) throw sessionsError;
    }

    const { error: reportsError } = await supabaseAdmin.from('reports').delete().eq('qr_code_id', qrId);
    if (reportsError) throw reportsError;

    const { error: productsError } = await supabaseAdmin.from('products').delete().eq('qr_code_id', qrId);
    if (productsError) throw productsError;

    const { data, error } = await supabaseAdmin
      .from('qr_codes')
      .delete()
      .eq('id', qrId)
      .select()
      .maybeSingle();

    if (error) throw error;

    // Best-effort: also drop the uploaded sticker image so a deleted QR doesn't
    // leave an orphaned file behind in the "Stickers" bucket forever. Matches the
    // upload naming convention in qrController.saveStickerImage (stickers/<id>.<ext>);
    // removing a key that doesn't exist is a silent no-op, so both extensions are
    // safe to try without knowing which one (if any) was actually uploaded.
    try {
      await supabaseAdmin.storage.from('Stickers').remove([`stickers/${qrId}.png`, `stickers/${qrId}.avif`]);
    } catch (err) {
      console.warn(`QrModel.delete (${qrId}): sticker image cleanup failed:`, err);
    }

    return data;
  }

  /**
   * Delete all QR Code records and their dependents (see delete() above for why
   * this cannot swallow errors).
   */
  static async deleteAll() {
    const { error: messagesError } = await supabaseAdmin.from('chat_messages').delete().not('id', 'is', null);
    if (messagesError) throw messagesError;

    const { error: sessionsError } = await supabaseAdmin.from('chat_sessions').delete().not('id', 'is', null);
    if (sessionsError) throw sessionsError;

    const { error: reportsError } = await supabaseAdmin.from('reports').delete().not('id', 'is', null);
    if (reportsError) throw reportsError;

    const { error: productsError } = await supabaseAdmin.from('products').delete().not('id', 'is', null);
    if (productsError) throw productsError;

    const { error } = await supabaseAdmin.from('qr_codes').delete().not('id', 'is', null);
    if (error) throw error;

    // Best-effort: clear every uploaded sticker image too, so "Clear all" doesn't
    // leave the whole bucket full of orphaned files with no QR record left to own them.
    try {
      const { data: files } = await supabaseAdmin.storage.from('Stickers').list('stickers');
      if (files && files.length > 0) {
        await supabaseAdmin.storage.from('Stickers').remove(files.map((f) => `stickers/${f.name}`));
      }
    } catch (err) {
      console.warn('QrModel.deleteAll: sticker image cleanup failed:', err);
    }

    return true;
  }
}

module.exports = QrModel;
