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
      .select('id, client_id, status, scans_count, last_scanned_at, template_name, fg_color, bg_color, sticker_image, category, created_at, activation_code')
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
      .select('id, client_id, status, scans_count, last_scanned_at, template_name, fg_color, bg_color, sticker_image, category, created_at, activation_code')
      .eq('id', qrId)
      .maybeSingle();

    if (error) throw error;
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
  activationCode?: string;
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
        fg_color: qr.fgColor || 'EAB308',
        bg_color: qr.bgColor || 'FFFFFF',
        activation_code: qr.activationCode,
      })
      .select('id, client_id, status, scans_count, category, created_at, activation_code');

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
      scans_count: qr.scans || 0,
      template_name: qr.template || 'Default',
      category: qr.category || 'car',
      fg_color: qr.fg || 'EAB308',
      bg_color: qr.bg || 'FFFFFF',
      activation_code: qr.activationCode,
    }));

    const { data, error } = await supabase
      .from('qr_codes')
      .upsert(records)
      .select('id, client_id, status, category, activation_code');
      
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase bulk save QR codes error:', err);
    return null;
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
  id?: string;
  name: string;
  fgColor: string;
  bgColor: string;
  stickerPos?: { x: number; y: number; w: number; h: number };
  isDefault?: boolean;
}) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('templates')
      .upsert({
        id: template.id,
        name: template.name,
        fg_color: template.fgColor,
        bg_color: template.bgColor,
        sticker_pos: template.stickerPos || { x: 110, y: 40, w: 100, h: 100 },
        is_default: template.isDefault || false,
      })
      .select('id, name, fg_color, bg_color, sticker_pos');

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase save template error:', err);
    return null;
  }
}

/**
 * Delete template from Supabase
 */
export async function deleteTemplateFromDb(templateId: string) {
  if (!isSupabaseConfigured) return null;
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete template error:', err);
    return false;
  }
}

/**
 * Save sticker QR Placement coordinates (x, y, w, h) to Supabase
 */
export async function saveStickerPosToDb(pos: { x: number; y: number; w: number; h: number }) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('templates')
      .upsert({
        name: 'Default',
        fg_color: 'EAB308',
        bg_color: 'FFFFFF',
        sticker_pos: pos,
        is_default: true,
      }, { onConflict: 'name' })
      .select('name, sticker_pos');

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
  emergencyPhone?: string;
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
          emergencyPhone: data.emergencyPhone || '',
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
 * Fetch user products/vehicles with minimal payload requirement
 */
export async function getProductsFromDb(userId?: string, limitCount = 100) {
  if (!isSupabaseConfigured) return null;
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
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase fetch products error:', err);
    return null;
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
