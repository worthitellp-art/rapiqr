const { supabaseAdmin } = require('../config/db');

const LIST_SELECT = '*, qr_codes(id, status, scans_count, last_scanned_at, sticker_image, fg_color, bg_color)';
const ADMIN_SEARCH_SELECT = `${LIST_SELECT}, profiles(id, email, full_name, phone_number)`;

class ProductModel {
  /**
   * Admin-only: search stickers/products across ALL users by QR code id, name,
   * vehicle number, assigned-to, owner phone/email (from the details JSONB blob),
   * or the linked account's own email/name/phone. Filtered in application code
   * (rather than a PostgREST JSONB filter string) since the searchable fields span
   * both plain columns and a JSONB blob — simpler and safer than hand-built filters
   * at the scale this support console needs to handle.
   */
  static async searchAll(query, limit = 500) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(ADMIN_SEARCH_SELECT)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      const rows = data || [];

      const term = String(query || '').trim().toLowerCase();
      if (!term) return rows;

      const digits = term.replace(/\D/g, '');
      return rows.filter((p) => {
        const haystacks = [
          p.qr_code_id, p.name, p.vehicle_number, p.assigned_to,
          p.details?.ownerPhone, p.details?.ownerEmail,
          p.profiles?.email, p.profiles?.full_name, p.profiles?.phone_number,
        ].filter(Boolean).map((v) => String(v).toLowerCase());

        const matchesText = haystacks.some((h) => h.includes(term));
        const matchesPhone = digits.length >= 4 && haystacks.some((h) => h.replace(/\D/g, '').includes(digits));
        return matchesText || matchesPhone;
      });
    } catch (err) {
      console.error('ProductModel.searchAll Error:', err);
      return [];
    }
  }

  /**
   * Fetch all products owned by a given user, with their linked QR code fleet record embedded.
   */
  static async getAllByUser(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(LIST_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('ProductModel.getAllByUser Error:', err);
      return [];
    }
  }

  static async getByQrCodeId(qrCodeId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(LIST_SELECT)
        .eq('qr_code_id', qrCodeId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`ProductModel.getByQrCodeId (${qrCodeId}) Error:`, err);
      return null;
    }
  }

  /**
   * Attach an unclaimed product (activated anonymously, e.g. via a public scan before
   * the owner logged in) to the current user's account.
   */
  static async claim(productId, userId, userName) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .update({ user_id: userId, assigned_to: userName || 'Self' })
        .eq('id', productId)
        .select(LIST_SELECT)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`ProductModel.claim (${productId}) Error:`, err);
      return null;
    }
  }

  /**
   * Auto-link every unclaimed product (activated on the public scan page, no
   * account attached yet) whose registered owner phone matches this user's
   * account phone number — no activation code needed, purely phone-based
   * (replaces the old manual code+phone claim flow).
   */
  static async autoClaimByPhone(userId, userName, phone) {
    const suppliedPhone = String(phone || '').replace(/\D/g, '');
    if (!suppliedPhone) return [];

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(LIST_SELECT)
      .is('user_id', null);

    if (error) throw error;

    const matches = (data || []).filter((p) => {
      const registeredPhone = String(p.details?.ownerPhone || '').replace(/\D/g, '');
      return registeredPhone && (registeredPhone.includes(suppliedPhone) || suppliedPhone.includes(registeredPhone));
    });

    const claimed = [];
    for (const p of matches) {
      const { data: updated, error: claimError } = await supabaseAdmin
        .from('products')
        .update({ user_id: userId, assigned_to: userName || 'Self' })
        .eq('id', p.id)
        .select(LIST_SELECT)
        .single();
      if (claimError) {
        console.error(`ProductModel.autoClaimByPhone: failed to claim ${p.id}`, claimError);
        continue;
      }
      claimed.push(updated);
    }
    return claimed;
  }

  static async getById(productId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(LIST_SELECT)
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`ProductModel.getById (${productId}) Error:`, err);
      return null;
    }
  }

  /**
   * Edit sticker/product details. Scalar columns update directly; everything else
   * (address, bloodGroup, allergies, ownerPhone, ownerEmail, ...) merges into the
   * `details` JSONB blob so we never clobber fields the caller didn't send.
   */
  static async updateDetails(productId, updates) {
    try {
      const current = await this.getById(productId);
      if (!current) return null;

      const payload = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.vehicleNumber !== undefined) payload.vehicle_number = updates.vehicleNumber;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
      if (updates.status !== undefined && ['active', 'inactive', 'lost', 'replaced'].includes(updates.status)) {
        payload.status = updates.status;
      }

      const detailFields = ['address', 'bloodGroup', 'allergies', 'ownerPhone', 'ownerEmail', 'notes'];
      const mergedDetails = { ...(current.details || {}) };
      let detailsChanged = false;
      for (const field of detailFields) {
        if (updates[field] !== undefined) {
          mergedDetails[field] = updates[field];
          detailsChanged = true;
        }
      }
      if (detailsChanged) payload.details = mergedDetails;

      if (Object.keys(payload).length === 0) return current;

      const { data, error } = await supabaseAdmin
        .from('products')
        .update(payload)
        .eq('id', productId)
        .select(LIST_SELECT)
        .single();

      if (error) throw error;

      if (payload.status && data?.qr_code_id) {
        await supabaseAdmin
          .from('qr_codes')
          .update({ status: payload.status === 'active' ? 'active' : 'inactive' })
          .eq('id', data.qr_code_id);
      }

      return data;
    } catch (err) {
      console.error(`ProductModel.updateDetails (${productId}) Error:`, err);
      return null;
    }
  }

  /**
   * Replace the emergency contacts list for a product.
   * contacts: [{ name, phone }, ...]
   */
  static async updateContacts(productId, contacts) {
    try {
      const current = await this.getById(productId);
      if (!current) return null;

      const mergedDetails = { ...(current.details || {}), emergencyContacts: contacts };

      const { data, error } = await supabaseAdmin
        .from('products')
        .update({ details: mergedDetails })
        .eq('id', productId)
        .select(LIST_SELECT)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`ProductModel.updateContacts (${productId}) Error:`, err);
      return null;
    }
  }

  static async setStatus(productId, status) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .update({ status })
        .eq('id', productId)
        .select(LIST_SELECT)
        .single();

      if (error) throw error;

      // Keep the fleet record's own status roughly in sync so admin views stay consistent.
      if (data?.qr_code_id) {
        await supabaseAdmin
          .from('qr_codes')
          .update({ status: status === 'active' ? 'active' : 'inactive' })
          .eq('id', data.qr_code_id);
      }

      return data;
    } catch (err) {
      console.error(`ProductModel.setStatus (${productId}) Error:`, err);
      return null;
    }
  }

  /**
   * Transfer ownership of a sticker/product to another registered account (by email).
   */
  static async transfer(productId, targetUserId, targetName) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .update({ user_id: targetUserId, assigned_to: targetName || 'New Owner' })
        .eq('id', productId)
        .select(LIST_SELECT)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`ProductModel.transfer (${productId}) Error:`, err);
      return null;
    }
  }

  static async remove(productId) {
    try {
      const current = await this.getById(productId);
      if (!current) return false;

      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // Free up the underlying QR code so it can be re-activated on a fresh product.
      if (current.qr_code_id) {
        await supabaseAdmin
          .from('qr_codes')
          .update({ status: 'inactive' })
          .eq('id', current.qr_code_id);
      }

      return true;
    } catch (err) {
      console.error(`ProductModel.remove (${productId}) Error:`, err);
      return false;
    }
  }

  /**
   * Scan/alert history (reports table) for a single product, newest first.
   */
  static async getHistory(productId, limit = 100) {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .select('id, type, message, reporter_phone, location, status, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`ProductModel.getHistory (${productId}) Error:`, err);
      return [];
    }
  }
}

module.exports = ProductModel;
