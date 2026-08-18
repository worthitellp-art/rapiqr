import { supabase, isSupabaseConfigured } from './supabase';
import { apiClient, isApiBackendConfigured } from './apiClient';
import type { Report } from '../types';

/**
 * Fetch registered QR codes.
 * Prefers the Render/Express API when configured; falls back to direct Supabase.
 */
export async function getQrCodesFromDb(limitCount = 100) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.qr.getQrCodes(limitCount);
      return (res.data || []) as any[];
    } catch (err) {
      console.warn('Backend fetch QR codes error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('id, client_id, status, scans_count, last_scanned_at, template_name, fg_color, bg_color, sticker_image, category, created_at')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase fetch QR codes error:', err);
    return null;
  }
}

/**
 * Fetch single QR code by ID
 */
export async function getQrCodeByIdFromDb(qrId: string) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.qr.getQrCodeById(qrId);
      return (res.data || null) as any;
    } catch (err) {
      console.warn(`Backend fetch QR ${qrId} error (falling back to Supabase):`, err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('id, client_id, status, scans_count, last_scanned_at, template_name, fg_color, bg_color, sticker_image, category, created_at')
      .eq('id', qrId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      try {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .or(`qr_code_id.eq.${qrId},id.eq.${qrId}`)
          .maybeSingle();

        if (product) {
          return {
            ...data,
            vehicleName: product.name || (data as any).vehicleName || "Safety QR Tag",
            vehicleNumber: product.vehicle_number || (data as any).vehicleNumber || "TAG-101",
            contacts: product.details?.emergencyContacts || product.contacts,
            emergencyContacts: product.details?.emergencyContacts || product.contacts,
            details: product.details,
          };
        }
      } catch {
        // Non-blocking fallback if products table query fails
      }
    }

    return data;
  } catch (err) {
    console.warn(`Supabase fetch QR ${qrId} error:`, err);
    return null;
  }
}

/**
 * Save a single QR code record to Supabase
 */
export async function saveQrCodeToDb(qr: {
  id: string;
  clientId?: string;
  status: string;
  scansCount?: number;
  templateName?: string;
  category?: string;
  fgColor?: string;
  bgColor?: string;
  stickerImage?: string;
}) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.qr.saveQrCode(qr);
      return (res.data || null) as any;
    } catch (err) {
      console.warn('Backend save QR code error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .upsert({
        id: qr.id,
        client_id: qr.clientId || qr.id,
        status: qr.status || 'inactive',
        scans_count: qr.scansCount || 0,
        template_name: qr.templateName || 'Default',
        category: qr.category || 'car',
        fg_color: qr.fgColor || 'D9581F',
        bg_color: qr.bgColor || 'FFFFFF',
        sticker_image: qr.stickerImage || (qr as any).sticker_image || null,
      }, { onConflict: 'id' })
      .select('id, client_id, status, scans_count, category, sticker_image, fg_color, bg_color, created_at');

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase save QR code error:', err);
    return null;
  }
}

/**
 * Bulk save QR codes to Supabase with batched insert
 */
export async function bulkSaveQrCodesToDb(qrList: any[]) {
  if (isApiBackendConfigured) {
    try {
      // Backend has no bulk endpoint; loop single saves.
      const results: any[] = [];
      for (const qr of qrList) {
        const res = await apiClient.qr.saveQrCode(qr);
        if (res.data) results.push(res.data);
      }
      return results as any;
    } catch (err) {
      console.warn('Backend bulk save QR codes error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured || !qrList.length) return null;
  try {
    const records = qrList.map((qr) => ({
      id: qr.id,
      client_id: qr.clientId || qr.id,
      status: qr.status || 'inactive',
      scans_count: qr.scans || qr.scansCount || 0,
      template_name: qr.template || qr.templateName || 'Default',
      category: qr.category || 'car',
      fg_color: qr.fg || qr.fgColor || 'D9581F',
      bg_color: qr.bg || qr.bgColor || 'FFFFFF',
      sticker_image: qr.stickerImage || qr.sticker_image || null,
    }));

    const { data, error } = await supabase
      .from('qr_codes')
      .upsert(records, { onConflict: 'id' })
      .select('id, client_id, status, category, sticker_image');
      
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase bulk save QR codes error:', err);
    return null;
  }
}

/**
 * Delete a single QR code and its linked products from DB
 */
export async function deleteQrCodeFromDb(qrId: string) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.qr.deleteQrCode(qrId);
      if (res?.success) return true;
    } catch (err) {
      console.warn(`Backend delete QR ${qrId} error (falling back to Supabase):`, err);
    }
  }
  if (!isSupabaseConfigured) return true;
  try {
    // Delete associated products row if present
    await supabase.from('products').delete().eq('qr_code_id', qrId);
    // Delete record from qr_codes table
    const { error } = await supabase.from('qr_codes').delete().eq('id', qrId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn(`Supabase delete QR ${qrId} error:`, err);
    return false;
  }
}

/**
 * Delete all QR codes and linked products from DB
 */
export async function deleteAllQrCodesFromDb() {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.qr.deleteAllQrCodes();
      if (res?.success) return true;
    } catch (err) {
      console.warn('Backend clear all QR codes error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return true;
  try {
    await supabase.from('products').delete().not('id', 'is', null);
    const { error } = await supabase.from('qr_codes').delete().not('id', 'is', null);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase clear all QR codes error:', err);
    return false;
  }
}

/**
 * Fetch all user profiles from DB (with fallback to direct Supabase query)
 */
export async function getUsersFromDb(search?: string) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.admin.listUsers(search);
      if (res?.success && Array.isArray(res.data)) return res.data;
    } catch (err) {
      console.warn('Backend listUsers failed, falling back to Supabase profiles:', err);
    }
  }
  if (!isSupabaseConfigured) return [];
  try {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone_number.ilike.%${s}%`);
    }
    const { data, error } = await query;
    if (error) throw error;

    // Count products per user
    const { data: products } = await supabase.from('products').select('user_id');
    const countMap: Record<string, number> = {};
    (products || []).forEach((p: any) => {
      if (p.user_id) countMap[p.user_id] = (countMap[p.user_id] || 0) + 1;
    });

    return (data || []).map((u: any) => ({
      id: u.id,
      email: u.email || '',
      full_name: u.full_name || u.email?.split('@')[0] || 'User',
      phone_number: u.phone_number || null,
      role: u.role || 'client',
      subscription_plan: u.subscription_plan || 'free',
      is_subscribed: Boolean(u.is_subscribed),
      created_at: u.created_at || new Date().toISOString(),
      stickerCount: countMap[u.id] || 0,
      metadata: u.metadata || {},
    }));
  } catch (err) {
    console.error('getUsersFromDb error:', err);
    return [];
  }
}

/**
 * Delete user account and linked products from DB
 */
export async function deleteUserFromDb(userId: string) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.admin.deleteUser(userId);
      if (res?.success) return true;
    } catch (err) {
      console.warn(`Backend deleteUser ${userId} error, falling back to Supabase:`, err);
    }
  }
  if (!isSupabaseConfigured) return true;
  try {
    try { await supabase.from('orders').update({ user_id: null }).eq('user_id', userId); } catch { /* ignore */ }
    try { await supabase.from('chat_sessions').delete().eq('owner_id', userId); } catch { /* ignore */ }
    try { await supabase.from('products').update({ user_id: null, assigned_to: 'Unassigned' }).eq('user_id', userId); } catch { /* ignore */ }

    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
      console.warn(`Profiles delete warning for ${userId}:`, error.message);
    }
    return true;
  } catch (err) {
    console.error(`deleteUserFromDb error for ${userId}:`, err);
    return false;
  }
}

/**
 * Fetch sticker customization templates from Supabase
 */
export async function getTemplatesFromDb() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, fg_color, bg_color, sticker_pos, is_default, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase fetch templates error:', err);
    return null;
  }
}

/**
 * Save / Upsert sticker template to Supabase
 */
export async function saveTemplateToDb(template: {
  id?: string | number;
  name: string;
  fgColor: string;
  bgColor: string;
  stickerPos?: { x: number; y: number; w: number; h: number };
  isDefault?: boolean;
}) {
  const fallbackRecord = {
    id: template.id || Date.now(),
    name: template.name,
    fg_color: template.fgColor,
    bg_color: template.bgColor,
    sticker_pos: template.stickerPos,
    is_default: template.isDefault || false,
  };

  if (!isSupabaseConfigured) return fallbackRecord;

  try {
    const payload: Record<string, any> = {
      name: template.name,
      fg_color: template.fgColor,
      bg_color: template.bgColor,
      sticker_pos: template.stickerPos || { x: 110, y: 40, w: 100, h: 100 },
      is_default: template.isDefault || false,
    };

    const templateIdString = template.id != null ? String(template.id) : null;
    const isUuidFormat = !!templateIdString && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateIdString);

    if (isUuidFormat) {
      payload.id = templateIdString;
    }

    // Only one template may be default at a time — clear any other holder first
    // so this upsert can never leave two rows both marked is_default.
    if (payload.is_default) {
      let resetQuery = supabase.from('templates').update({ is_default: false });
      resetQuery = isUuidFormat ? resetQuery.neq('id', templateIdString) : resetQuery.neq('name', template.name);
      await resetQuery;
    }

    const { data: templateResponse, error: databaseError } = isUuidFormat
      ? await supabase
          .from('templates')
          .upsert(payload, { onConflict: 'id' })
          .select('id, name, fg_color, bg_color, sticker_pos, is_default')
      : await supabase
          .from('templates')
          .upsert(payload, { onConflict: 'name' })
          .select('id, name, fg_color, bg_color, sticker_pos, is_default');

    if (databaseError) throw databaseError;
    return templateResponse && templateResponse.length > 0 ? templateResponse[0] : fallbackRecord;
  } catch (error) {
    console.warn('Supabase save template error:', error);
    return fallbackRecord;
  }
}

/**
 * Delete template from Supabase
 */
export async function deleteTemplateFromDb(templateId: string | number, templateName?: string) {
  if (!isSupabaseConfigured) return true;

  try {
    const idString = String(templateId);
    const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idString);

    let deleteQuery = supabase.from('templates').delete();
    if (isUuidFormat) {
      deleteQuery = deleteQuery.eq('id', idString);
    } else if (templateName) {
      deleteQuery = deleteQuery.eq('name', templateName);
    } else {
      deleteQuery = deleteQuery.eq('name', idString);
    }

    const { error: databaseError } = await deleteQuery;
    if (databaseError) throw databaseError;
    return true;
  } catch (error) {
    console.warn('Supabase delete template error:', error);
    return true;
  }
}

/**
 * Update default template status in Supabase
 */
export async function setDefaultTemplateInDb(templateId: string | number, templateName?: string) {
  if (!isSupabaseConfigured) return true;

  try {
    const idString = String(templateId);
    const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idString);

    // Reset default status across all templates
    await supabase
      .from('templates')
      .update({ is_default: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Mark the selected template as default
    let updateQuery = supabase.from('templates').update({ is_default: true });
    if (isUuidFormat) {
      updateQuery = updateQuery.eq('id', idString);
    } else {
      updateQuery = updateQuery.eq('name', templateName || idString);
    }

    const { error: databaseError } = await updateQuery;
    if (databaseError) throw databaseError;
    return true;
  } catch (error) {
    console.warn('Supabase set default template error:', error);
    return true;
  }
}

/**
 * Save sticker QR Placement coordinates (x, y, w, h) to Supabase
 */
export async function saveStickerPosToDb(pos: { x: number; y: number; w: number; h: number }, fgColor?: string, bgColor?: string) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: existing } = await supabase
      .from('templates')
      .select('fg_color, bg_color')
      .eq('is_default', true)
      .maybeSingle();

    const cleanFg = (fgColor || existing?.fg_color || 'EAB308').replace(/#/g, '').toUpperCase();
    const cleanBg = (bgColor || existing?.bg_color || 'FFFFFF').replace(/#/g, '').toUpperCase();

    const { data, error } = await supabase
      .from('templates')
      .upsert({
        name: 'Default',
        fg_color: cleanFg,
        bg_color: cleanBg,
        sticker_pos: pos,
        is_default: true,
      }, { onConflict: 'name' })
      .select('name, sticker_pos, fg_color, bg_color');

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase save sticker position error:', err);
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Save a generated sticker image to the "Stickers" storage bucket
 * and persist its public URL on the qr_codes record.
 * Prefers the Render/Express API (service role); falls back to direct Supabase.
 */
export async function saveStickerImageToDb(qrId: string, image: Blob | string) {
  if (isApiBackendConfigured) {
    try {
      const dataUrl = typeof image === 'string' ? image : await blobToDataUrl(image);
      const res = await apiClient.qr.saveStickerImage(qrId, dataUrl);
      return res?.stickerImage || res?.data?.sticker_image || res?.data || null;
    } catch (err) {
      console.warn('Backend save sticker image error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    const fileName = `stickers/${qrId}.png`;
    const { error: uploadError } = await supabase.storage
      .from('Stickers')
      .upload(fileName, image, { upsert: true, contentType: 'image/png' });

    if (uploadError) throw uploadError;

    const { data: pub } = supabase.storage.from('Stickers').getPublicUrl(fileName);
    const publicUrl = pub.publicUrl;

    const { error: dbError } = await supabase
      .from('qr_codes')
      .update({ sticker_image: publicUrl })
      .eq('id', qrId);

    if (dbError) throw dbError;
    return publicUrl;
  } catch (err) {
    console.warn('Supabase save sticker image error:', err);
    return null;
  }
}

/**
 * Activate a QR code and save the user's registration profile to DB
 * Updates qr_codes status and creates/updates a products record
 */
export async function activateQrInDb(data: {
  qrId: string;
  category?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  emergencyContacts?: { name: string; relationship: string; phone: string }[];
  bloodGroup?: string;
  allergies?: string;
  address?: string;
  userId?: string;
}) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.qr.activateQrCode(data.qrId, data);
      return (res.data || null) as any;
    } catch (err) {
      console.warn('Backend activate QR error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    // 1. Update QR code status to active
    const { error: qrError } = await supabase
      .from('qr_codes')
      .update({ status: 'active' })
      .eq('id', data.qrId);

    if (qrError) throw qrError;

    // 2. Upsert a product record with the registration details
    const { error: productError } = await supabase
      .from('products')
      .upsert({
        qr_code_id: data.qrId,
        user_id: data.userId || null,
        category: (data.category || 'car') as any,
        name: data.ownerName,
        status: 'active',
        assigned_to: data.ownerName,
        details: {
          ownerPhone: data.ownerPhone,
          ownerEmail: data.ownerEmail || '',
          emergencyContacts: data.emergencyContacts || [],
          bloodGroup: data.bloodGroup || '',
          allergies: data.allergies || '',
          address: data.address || '',
          activatedAt: new Date().toISOString(),
        },
      }, { onConflict: 'qr_code_id' });

    if (productError) throw productError;
    return { success: true };
  } catch (err) {
    console.warn('Supabase activate QR error:', err);
    return null;
  }
}

/**
 * Send the post-activation confirmation email (and a sample "test scan" preview email)
 * to the sticker owner. Real delivery requires SMTP credentials configured on the Express
 * backend (Server/.env) — without a backend at all (Supabase-direct setups), this instead
 * writes what WOULD have been sent as server_logs entries, visible in the admin Live Logs
 * page, so activation confirmations are never silently dropped.
 */
export async function sendActivationNotifications(data: {
  qrId: string;
  ownerName: string;
  ownerEmail?: string;
  category?: string;
}) {
  if (isApiBackendConfigured) {
    try {
      await apiClient.notifications.sendActivationConfirmation(data);
      return true;
    } catch (err) {
      console.warn('Backend activation notification error (falling back to logging):', err);
    }
  }
  if (!isSupabaseConfigured) return false;
  try {
    const to = data.ownerEmail?.trim();
    const rows: Record<string, any>[] = to
      ? [
          {
            level: 'INFO',
            category: 'EXTERNAL',
            service: 'repiqr-client',
            tag: 'ACTIVATION_CONFIRMATION_EMAIL',
            event: 'ACTIVATION_CONFIRMATION_EMAIL',
            message: `[SIMULATED] Would send "Your RapiQR sticker is now active!" to ${to} (no Express backend/SMTP configured to send for real)`,
            details: { to, qrId: data.qrId, ownerName: data.ownerName },
            resource_id: data.qrId,
          },
          {
            level: 'INFO',
            category: 'EXTERNAL',
            service: 'repiqr-client',
            tag: 'SAMPLE_TEST_SCAN_EMAIL',
            event: 'SAMPLE_TEST_SCAN_EMAIL',
            message: `[SIMULATED] Would send a sample "what responders see" test-scan preview to ${to}`,
            details: { to, qrId: data.qrId, category: data.category || 'car' },
            resource_id: data.qrId,
          },
        ]
      : [
          {
            level: 'WARN',
            category: 'EXTERNAL',
            service: 'repiqr-client',
            tag: 'ACTIVATION_CONFIRMATION_EMAIL',
            event: 'ACTIVATION_CONFIRMATION_EMAIL',
            message: `Skipped activation confirmation email for ${data.qrId} — no email on file`,
            details: { qrId: data.qrId, ownerName: data.ownerName },
            resource_id: data.qrId,
          },
        ];

    const { error } = await supabase.from('server_logs').insert(rows);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase activation notification log error:', err);
    return false;
  }
}

/**
 * Fetch the logged-in user's registered stickers/products (My Products dashboard).
 * Prefers the Render/Express API (scoped to the authenticated user server-side);
 * falls back to a direct Supabase query filtered by userId.
 */
export async function getProductsFromDb(userId?: string, phoneNumber?: string, limitCount = 100) {
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '');

  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.products.list();
      const list = (res.data || []) as any[];
      if (list.length > 0) return list;
    } catch (err) {
      console.warn('Backend fetch products error (falling back to Supabase):', err);
    }
  }

  let dbProducts: any[] = [];
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('products')
        .select('id, user_id, qr_code_id, category, name, vehicle_number, status, assigned_to, scans_count, details, created_at')
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (!error && data) {
        dbProducts = [...data];
      }

      // Auto-claim / query any product matched by phone number in Supabase if phoneNumber is provided
      if (cleanPhone && cleanPhone.length >= 7) {
        try {
          const { data: candidateStickers } = await supabase
            .from('products')
            .select('id, user_id, qr_code_id, category, name, vehicle_number, status, assigned_to, scans_count, details, created_at')
            .or(userId ? `user_id.is.null,user_id.neq.${userId}` : 'user_id.is.null')
            .limit(200);

          const isMatch = (p1?: string | null, p2?: string | null) => {
            if (!p1 || !p2) return false;
            const d1 = String(p1).replace(/\D/g, '');
            const d2 = String(p2).replace(/\D/g, '');
            if (!d1 || !d2) return false;
            if (d1 === d2) return true;
            const l1 = d1.length >= 10 ? d1.slice(-10) : d1;
            const l2 = d2.length >= 10 ? d2.slice(-10) : d2;
            if (l1.length >= 7 && l1 === l2) return true;
            return d1.includes(d2) || d2.includes(d1);
          };

          if (candidateStickers && candidateStickers.length > 0) {
            const matches = candidateStickers.filter((p: any) => {
              const phones = [
                p.details?.ownerPhone,
                p.details?.phone,
                p.details?.phoneNumber,
                p.details?.owner_phone,
                p.assigned_to,
                p.vehicle_number,
              ].filter(Boolean);
              if (Array.isArray(p.details?.emergencyContacts)) {
                for (const c of p.details.emergencyContacts) {
                  if (c?.phone) phones.push(c.phone);
                }
              }
              return phones.some((ph) => isMatch(ph, cleanPhone));
            });

            for (const p of matches) {
              if (!dbProducts.some((exist) => exist.id === p.id)) {
                dbProducts.push(p);
                // If user is authenticated, claim it in DB
                if (userId) {
                  try {
                    await supabase.from('products').update({ user_id: userId }).eq('id', p.id);
                  } catch { /* ignore error */ }
                }
              }
            }
          }
        } catch { /* ignore auto-claim error */ }
      }
    } catch (err) {
      console.warn('Supabase fetch products error:', err);
    }
  }

  // Fallback / augmentation from local QR list & stored sticker states
  const localQrRaw = typeof window !== 'undefined'
    ? (localStorage.getItem('repiqr-qrlist') || localStorage.getItem('namoqr-qrlist'))
    : null;

  if (localQrRaw) {
    try {
      const localQrs = JSON.parse(localQrRaw) as any[];
      const phoneMatches = localQrs.filter((q: any) => {
        const qPhone = String(q.ownerPhone || q.phoneNumber || q.phone || q.details?.ownerPhone || '').replace(/\D/g, '');
        const qUserId = q.userId || q.user_id;

        if (cleanPhone && cleanPhone.length >= 7 && qPhone && (qPhone.includes(cleanPhone) || cleanPhone.includes(qPhone))) {
          return true;
        }
        if (userId && qUserId === userId) return true;
        return false;
      });

      if (phoneMatches.length > 0) {
        const existingQrIds = new Set(dbProducts.map((p) => p.qr_code_id || p.id));
        for (const q of phoneMatches) {
          const itemCode = q.id || q.qrCodeId || q.code;
          if (itemCode && !existingQrIds.has(itemCode)) {
            dbProducts.push({
              id: itemCode,
              qr_code_id: itemCode,
              category: q.category || 'car',
              name: q.nickname || q.ownerName || q.name || itemCode,
              status: q.status || 'active',
              assigned_to: q.ownerName || 'Self',
              scans_count: q.scans || 0,
              details: {
                ownerPhone: q.ownerPhone || q.phoneNumber || phoneNumber || '',
                ownerEmail: q.ownerEmail || '',
                emergencyContacts: q.contacts || q.emergencyContacts || [],
                bloodGroup: q.bloodGroup || '',
                allergies: q.allergies || '',
                address: q.address || '',
                activatedAt: q.createdAt || new Date().toISOString(),
              },
              created_at: q.createdAt || new Date().toISOString(),
            });
            existingQrIds.add(itemCode);
          }
        }
      }
    } catch {
      /* ignore storage parse error */
    }
  }

  return dbProducts;
}

/**
 * Edit a sticker/product's details (name, category, vehicle number, address,
 * blood group, allergies, owner phone/email). Merges into the `details` JSONB
 * blob so unspecified fields are preserved.
 */
export async function updateProductDetailsInDb(productId: string, updates: Record<string, any>): Promise<{ success: boolean; data?: any; error?: string }> {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.products.updateDetails(productId, updates);
      return { success: true, data: res.data || null };
    } catch (err: any) {
      if (!isSupabaseConfigured) return { success: false, error: err?.message || 'Failed to update sticker details' };
      console.warn('Backend update product details error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return { success: false, error: 'Backend not configured' };
  try {
    const { data: current, error: fetchError } = await supabase
      .from('products')
      .select('details')
      .eq('id', productId)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.vehicleNumber !== undefined) payload.vehicle_number = updates.vehicleNumber;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;

    const detailFields = ['address', 'bloodGroup', 'allergies', 'ownerPhone', 'ownerEmail', 'notes'];
    const mergedDetails = { ...(current?.details || {}) };
    let changed = false;
    for (const field of detailFields) {
      if (updates[field] !== undefined) {
        mergedDetails[field] = updates[field];
        changed = true;
      }
    }
    if (changed) payload.details = mergedDetails;

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase update product details error:', err);
    return { success: false, error: err?.message || 'Failed to update sticker details' };
  }
}

/**
 * Replace a sticker's emergency contacts list: [{ name, phone }, ...]
 */
export async function updateProductContactsInDb(productId: string, contacts: { name: string; phone: string }[]): Promise<{ success: boolean; data?: any; error?: string }> {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.products.updateContacts(productId, contacts);
      return { success: true, data: res.data || null };
    } catch (err: any) {
      if (!isSupabaseConfigured) return { success: false, error: err?.message || 'Failed to save contacts' };
      console.warn('Backend update product contacts error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return { success: false, error: 'Backend not configured' };
  try {
    const { data: current, error: fetchError } = await supabase
      .from('products')
      .select('details')
      .eq('id', productId)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const mergedDetails = { ...(current?.details || {}), emergencyContacts: contacts };

    const { data, error } = await supabase
      .from('products')
      .update({ details: mergedDetails })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase update product contacts error:', err);
    return { success: false, error: err?.message || 'Failed to save contacts' };
  }
}

/**
 * Deactivate / reactivate a sticker (also mirrors status onto its qr_codes row).
 */
export async function setProductStatusInDb(productId: string, active: boolean, qrCodeId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
  if (isApiBackendConfigured) {
    try {
      const res = active ? await apiClient.products.reactivate(productId) : await apiClient.products.deactivate(productId);
      return { success: true, data: res.data || null };
    } catch (err: any) {
      if (!isSupabaseConfigured) return { success: false, error: err?.message || 'Failed to update status' };
      console.warn('Backend set product status error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return { success: false, error: 'Backend not configured' };
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ status: active ? 'active' : 'inactive' })
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;

    if (qrCodeId) {
      await supabase.from('qr_codes').update({ status: active ? 'active' : 'inactive' }).eq('id', qrCodeId);
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase set product status error:', err);
    return { success: false, error: err?.message || 'Failed to update status' };
  }
}

/**
 * Transfer sticker ownership to another registered RapiQR account by email.
 * Direct-Supabase fallback can only look up profiles the client is allowed to read
 * under RLS, so this is best-effort outside the Express backend.
 */
export async function transferProductInDb(productId: string, targetEmail: string) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.products.transfer(productId, targetEmail);
      return { success: true, data: res.data } as { success: boolean; data?: any; error?: string };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to transfer sticker' };
    }
  }
  return { success: false, error: 'Transfers require the RapiQR backend to be configured.' };
}

/**
 * Permanently remove a sticker/product from the owner's dashboard.
 */
export async function deleteProductFromDb(productId: string, qrCodeId?: string): Promise<{ success: boolean; error?: string }> {
  if (isApiBackendConfigured) {
    try {
      await apiClient.products.remove(productId);
      return { success: true };
    } catch (err: any) {
      if (!isSupabaseConfigured) return { success: false, error: err?.message || 'Failed to delete sticker' };
      console.warn('Backend delete product error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return { success: false, error: 'Backend not configured' };
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
    if (qrCodeId) {
      await supabase.from('qr_codes').update({ status: 'inactive' }).eq('id', qrCodeId);
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase delete product error:', err);
    return { success: false, error: err?.message || 'Failed to delete sticker' };
  }
}

/**
 * Scan/alert history for a single sticker/product, newest first.
 */
export async function getProductHistoryFromDb(productId: string) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.products.getHistory(productId);
      return (res.data || []) as any[];
    } catch (err) {
      console.warn('Backend fetch product history error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, type, message, reporter_phone, location, status, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch product history error:', err);
    return [];
  }
}

/**
 * Create emergency scan report in Supabase
 */
export async function createReportInDb(report: Partial<Report>) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.alerts.createAlert(report);
      return (res.data || null) as any;
    } catch (err) {
      console.warn('Backend create report error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        qr_code_id: report.vehicleId,
        product_label: report.vehicleLabel || 'RapiQR Item',
        license_plate: report.licensePlate || null,
        type: report.type || 'contact_owner',
        message: report.message || '',
        reporter_phone: report.reporterPhone || null,
        location: report.location || null,
        status: report.status || 'unread',
      })
      .select('id, qr_code_id, status, created_at');

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase create report error:', err);
    return null;
  }
}

/**
 * Fetch unread & recent reports with column targeting
 */
export async function getReportsFromDb(limitCount = 50) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.alerts.getAlerts(limitCount);
      return (res.data || []) as any[];
    } catch (err) {
      console.warn('Backend fetch reports error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, qr_code_id, product_id, product_label, license_plate, type, message, reporter_phone, location, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase fetch reports error:', err);
    return null;
  }
}

/**
 * Fetch Live Server Logs from Supabase database
 */
export async function fetchServerLogsFromDb(limitCount = 100, levelFilter?: string, categoryFilter?: string) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.logs.getLogs(limitCount, levelFilter, categoryFilter);
      return (res.data || []) as any[];
    } catch (err) {
      console.warn('Backend fetch logs error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return [];
  try {
    let query = supabase
      .from('server_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (levelFilter && levelFilter !== 'ALL') {
      query = query.eq('level', levelFilter.toUpperCase());
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      query = query.eq('category', categoryFilter.toUpperCase());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch server logs error:', err);
    return [];
  }
}

/**
 * Clear Live Server Logs in Supabase
 */
export async function clearServerLogsInDb() {
  if (isApiBackendConfigured) {
    try {
      await apiClient.logs.clearLogs();
      return true;
    } catch (err) {
      console.warn('Backend clear logs error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('server_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
  } catch (err) {
    console.warn('Supabase clear server logs error:', err);
    return false;
  }
}

/**
 * Fetch helpline communication providers. Prefers the Render/Express API
 * (admin-only, sees inactive rows too) when configured; falls back to direct Supabase.
 */
export async function getCommunicationProvidersFromDb() {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.helplines.getAll();
      return (res.data || []) as any[];
    } catch (err) {
      console.warn('Backend fetch communication providers error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('communication')
      .select('id, category, label, phone, active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase fetch communication providers error:', err);
    return null;
  }
}

/**
 * Save helpline communication provider to Supabase
 */
export async function saveCommunicationProviderToDb(provider: {
  id?: string;
  category: string;
  label: string;
  phone: string;
  active?: boolean;
}) {
  if (isApiBackendConfigured) {
    try {
      const res = provider.id
        ? await apiClient.helplines.update(provider.id, provider)
        : await apiClient.helplines.create(provider);
      return res.data ? [res.data] : null;
    } catch (err) {
      console.warn('Backend save communication provider error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    const payload: any = {
      category: provider.category,
      label: provider.label,
      phone: provider.phone,
      active: provider.active !== undefined ? provider.active : true,
    };
    if (provider.id && typeof provider.id === 'string' && provider.id.includes('-')) {
      payload.id = provider.id;
    }

    const { data, error } = await supabase
      .from('communication')
      .upsert(payload)
      .select('id, category, label, phone, active, created_at');

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase save communication provider error:', err);
    return null;
  }
}

/**
 * Delete helpline communication provider from Supabase
 */
export async function deleteCommunicationProviderFromDb(providerId: string) {
  if (isApiBackendConfigured) {
    try {
      const res = await apiClient.helplines.remove(providerId);
      return Boolean(res.success);
    } catch (err) {
      console.warn('Backend delete communication provider error (falling back to Supabase):', err);
    }
  }
  if (!isSupabaseConfigured) return null;
  try {
    const { error } = await supabase
      .from('communication')
      .delete()
      .eq('id', providerId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete communication provider error:', err);
    return false;
  }
}

/**
 * Create order receipt directly in Supabase (or local storage fallback)
 */
export async function createOrderInDb(orderPayload: {
  name: string; email: string; phone: string;
  items: any[]; subtotal: number; deliveryFee: number; total: number;
  paymentMethod: string; deliveryMethod: string; shippingAddress?: any;
  userId?: string;
}) {
  const orderId = '#NQ-' + Math.floor(100000 + Math.random() * 899999);
  const payload = {
    id: orderId,
    user_id: orderPayload.userId || null,
    name: orderPayload.name,
    email: orderPayload.email,
    phone: orderPayload.phone,
    items: orderPayload.items || [],
    subtotal: orderPayload.subtotal || 0,
    delivery_fee: orderPayload.deliveryFee || 0,
    total: orderPayload.total || 0,
    payment_method: orderPayload.paymentMethod || 'upi',
    delivery_method: orderPayload.deliveryMethod || 'standard',
    shipping_address: orderPayload.shippingAddress || null,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        return { success: true, data: { id: data.id, ...data } };
      }
    } catch (err) {
      console.warn('Supabase create order error:', err);
    }
  }

  // Fallback to local storage persistence
  try {
    const existing = JSON.parse(localStorage.getItem('repiqr-orders') || localStorage.getItem('namoqr-orders') || '[]');
    const localOrder = { id: orderId, createdAt: new Date().toISOString(), ...payload };
    localStorage.setItem('repiqr-orders', JSON.stringify([localOrder, ...existing]));
    localStorage.setItem('namoqr-orders', JSON.stringify([localOrder, ...existing]));
    return { success: true, data: localOrder };
  } catch {
    return { success: true, data: { id: orderId, ...payload } };
  }
}

