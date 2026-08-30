const crypto = require('crypto');
const Sticker = require('./schemas/Sticker');
const ChatSession = require('./schemas/ChatSession');
const ChatMessage = require('./schemas/ChatMessage');
const Alert = require('./schemas/Alert');
const User = require('./schemas/User');
const { normalizePhone, isSamePhone } = require('../utils/phone');

// Fields safe to return from the PUBLIC scan/activate/record-scan endpoints —
// deliberately excludes user_id/name/assigned_to/vehicle_number/details, which
// hold the owner's PII (phone, email, address, blood group, emergency
// contacts). Sticker merges the old qr_codes + products tables into one
// document; without this whitelist, an unauthenticated caller who knows a
// sticker's ID could pull a stranger's medical/contact details straight off
// GET /api/qr/:id or the activate/scan response.
const PUBLIC_QR_FIELDS = '_id client_id status scans_count last_scanned_at template_name fg_color bg_color category created_at';

function toPublicQr(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    client_id: doc.client_id,
    status: doc.status,
    scans_count: doc.scans_count,
    last_scanned_at: doc.last_scanned_at,
    template_name: doc.template_name,
    fg_color: doc.fg_color,
    bg_color: doc.bg_color,
    category: doc.category,
    created_at: doc.created_at,
  };
}

// 12 hex characters (0-9, A-F only — no ambiguous 0/O or 1/I/l) from a CSPRNG:
// 48 bits of entropy, printed once on generation and never stored in plaintext.
function generateRecoveryCode() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

// Recovery codes are high-entropy random tokens, not user-chosen passwords —
// a fast one-way hash (matching passwordResetService's reset-token pattern)
// is the right tool here, not bcrypt.
function hashRecoveryCode(rawCode) {
  return crypto.createHash('sha256').update(String(rawCode || '').toUpperCase().trim()).digest('hex');
}

/**
 * Which account (if any) an activation should link the sticker to.
 *
 * An account with no verified phone yet is activating its own sticker (the
 * long-standing case, and the one ScanPage relies on), so that still links.
 * An account whose verified number contradicts the number being registered is
 * acting for a third party, so the row is left unclaimed for auto-claim to
 * hand to the person who actually owns that number. Admins manage the fleet
 * and should never claim personal ownership of customer stickers.
 */
async function resolveOwnerId(userId, ownerPhone) {
  if (!userId) return null;
  if (!normalizePhone(ownerPhone)) return null;

  try {
    const account = await User.findById(userId).select('phone_number role').lean();
    if (account?.role === 'admin') return null;

    const accountPhone = account?.phone_number;
    if (!normalizePhone(accountPhone)) return null;
    return isSamePhone(accountPhone, ownerPhone) ? userId : null;
  } catch (err) {
    console.error('QrModel.resolveOwnerId Error:', err);
    return null;
  }
}

class QrModel {
  /**
   * Admin fleet view — owner info is on the same document now (previously a
   * join against a separate `products` table). Excludes soft-deleted stickers.
   */
  static async getAll(limit = 100) {
    try {
      const docs = await Sticker.find({ deleted_at: null }).sort({ created_at: -1 }).limit(limit).lean();
      return docs.map((doc) => ({
        id: doc._id,
        client_id: doc.client_id,
        status: doc.status,
        scans_count: doc.scans_count,
        last_scanned_at: doc.last_scanned_at,
        template_name: doc.template_name,
        fg_color: doc.fg_color,
        bg_color: doc.bg_color,
        category: doc.category,
        created_at: doc.created_at,
        owner_phone: doc.details?.ownerPhone || null,
        owner_email: doc.details?.ownerEmail || null,
        owner_name: doc.name || doc.assigned_to || null,
        product_status: doc.status,
      }));
    } catch (err) {
      console.error('QrModel.getAll Error:', err);
      return [];
    }
  }

  /**
   * PUBLIC lookup (unauthenticated scan page) — see PUBLIC_QR_FIELDS. A
   * soft-deleted sticker reads as not-found, same as a real 404.
   */
  static async getById(qrId) {
    try {
      const doc = await Sticker.findOne({ _id: qrId, deleted_at: null }).select(PUBLIC_QR_FIELDS).lean();
      return toPublicQr(doc);
    } catch (err) {
      console.error(`QrModel.getById (${qrId}) Error:`, err);
      return null;
    }
  }

  /**
   * Save or update a QR code fleet record (colors/template/status). Only
   * touches qr-side fields via $set, so an admin editing a batch's template
   * can never clobber an owner's details/user_id sitting on the same document.
   *
   * On first creation, mints a recovery code and returns the raw value
   * exactly once (only the SHA-256 hash is persisted) — see
   * restoreByRecoveryCode. Editing an existing record never touches it.
   */
  static async save(qrData) {
    try {
      const rawId = qrData.id || qrData.client_id;
      if (!rawId || (typeof rawId !== 'string' && typeof rawId !== 'number')) return null;
      const id = String(rawId);

      const payload = {
        client_id: qrData.clientId || qrData.client_id || id || 'UNASSIGNED',
        status: qrData.status || 'inactive',
        scans_count: qrData.scansCount ?? qrData.scans_count ?? 0,
        template_name: qrData.templateName || qrData.template_name || 'Standard Badge',
        category: qrData.category || 'car',
        fg_color: qrData.fgColor || qrData.fg_color || 'D9581F',
        bg_color: qrData.bgColor || qrData.bg_color || 'FFFFFF',
      };

      const existing = await Sticker.findById(id).select('_id').lean();

      if (existing) {
        const doc = await Sticker.findByIdAndUpdate(id, { $set: payload }, { new: true })
          .select(PUBLIC_QR_FIELDS).lean();
        return toPublicQr(doc);
      }

      const rawRecoveryCode = generateRecoveryCode();
      const doc = await Sticker.create({
        _id: id,
        ...payload,
        recovery_code_hash: hashRecoveryCode(rawRecoveryCode),
        created_at: qrData.createdAt || qrData.created_at || new Date(),
      });

      return { ...toPublicQr(doc), recoveryCode: rawRecoveryCode };
    } catch (err) {
      console.error('QrModel.save Error:', err);
      return null;
    }
  }

  /**
   * Activate QR Code — writes the qr-side status and the product-side
   * ownership/details in one atomic update (previously two writes against
   * two tables), then returns only the public-safe fleet fields. Does not
   * swallow errors: a missing sticker or a write failure must propagate so
   * the controller never reports success:true on a failed activation.
   */
  static async activate(qrId, activationData) {
    const current = await Sticker.findOne({ _id: qrId, deleted_at: null }).select('details user_id category').lean();
    if (!current) {
      throw new Error(`QR code ${qrId} not found`);
    }

    const update = { status: 'active' };

    if (activationData.ownerName || activationData.ownerPhone) {
      // Read-modify-write on `details`: the owner who claimed this sticker and
      // the emergency contacts they curated must survive a second activation,
      // not get reset to null and replaced wholesale.
      const requestedUserId = activationData.userId || activationData.user_id || null;
      const ownerId = await resolveOwnerId(requestedUserId, activationData.ownerPhone);

      const details = { ...(current.details || {}) };
      if (activationData.ownerPhone) details.ownerPhone = activationData.ownerPhone;
      if (activationData.ownerEmail) details.ownerEmail = activationData.ownerEmail;
      if (Array.isArray(activationData.emergencyContacts) && activationData.emergencyContacts.length) {
        details.emergencyContacts = activationData.emergencyContacts;
      } else if (!Array.isArray(details.emergencyContacts)) {
        details.emergencyContacts = [];
      }
      if (activationData.bloodGroup) details.bloodGroup = activationData.bloodGroup;
      if (activationData.allergies) details.allergies = activationData.allergies;
      if (activationData.address) details.address = activationData.address;
      details.activatedAt = details.activatedAt || new Date();

      update.details = details;
      update.category = activationData.category || current.category || 'car';
      update.name = activationData.ownerName || 'Vehicle Owner';
      update.assigned_to = activationData.ownerName || 'Vehicle Owner';
      // A confirmed owner wins; otherwise keep whoever already holds it rather
      // than dropping the claim back to null on every re-activation.
      update.user_id = ownerId || current.user_id || null;
    }

    const doc = await Sticker.findByIdAndUpdate(qrId, { $set: update }, { new: true })
      .select(PUBLIC_QR_FIELDS)
      .lean();

    return toPublicQr(doc);
  }

  /**
   * Increment Scan Count — atomic, avoiding the read-then-write race the old
   * Postgres version had between fetching scans_count and writing it back.
   */
  static async recordScan(qrId) {
    try {
      const doc = await Sticker.findOneAndUpdate(
        { _id: qrId, deleted_at: null },
        { $inc: { scans_count: 1 }, $set: { last_scanned_at: new Date() } },
        { new: true }
      ).select(PUBLIC_QR_FIELDS).lean();
      return toPublicQr(doc);
    } catch (err) {
      console.error(`QrModel.recordScan (${qrId}) Error:`, err);
      return null;
    }
  }

  /**
   * Delete a QR Code record — soft delete: sets deleted_at rather than
   * removing the document, so its recovery_code_hash survives for a later
   * restoreByRecoveryCode call. Chat/alert history tied to it is still hard
   * -deleted here (that history isn't part of what recovery brings back).
   * Errors propagate (not caught-and-swallowed) so the caller gets a real
   * failure instead of a false success.
   */
  static async delete(qrId) {
    const sessions = await ChatSession.find({ qr_code_id: qrId }).select('_id').lean();
    const sessionIds = sessions.map((s) => s._id);
    if (sessionIds.length > 0) {
      await ChatMessage.deleteMany({ session_id: { $in: sessionIds } });
      await ChatSession.deleteMany({ qr_code_id: qrId });
    }

    await Alert.deleteMany({ sticker_id: qrId });

    const doc = await Sticker.findByIdAndUpdate(
      qrId,
      { $set: { deleted_at: new Date(), status: 'inactive' } },
      { new: true }
    ).select(PUBLIC_QR_FIELDS).lean();
    return toPublicQr(doc);
  }

  /**
   * Delete all QR Code records and their dependents. An explicit bulk wipe,
   * not a mistake-recovery scenario — unlike delete(), this really does
   * remove everything (see deleteAll() above for why this cannot swallow errors).
   */
  static async deleteAll() {
    await ChatMessage.deleteMany({});
    await ChatSession.deleteMany({});
    await Alert.deleteMany({});
    await Sticker.deleteMany({});
    return true;
  }

  /**
   * Admin recovery: restore a soft-deleted sticker on proof of possession of
   * its printed recovery code. `not_found` and `invalid_code` deliberately
   * share one outcome/message upstream — telling them apart would let a
   * caller use the response to enumerate valid sticker IDs.
   */
  static async restoreByRecoveryCode(id, rawRecoveryCode) {
    if (!id || !rawRecoveryCode) return { ok: false, reason: 'missing_fields' };

    const doc = await Sticker.findById(id).select('+recovery_code_hash deleted_at').lean();
    if (!doc || !doc.recovery_code_hash) return { ok: false, reason: 'not_found' };
    if (hashRecoveryCode(rawRecoveryCode) !== doc.recovery_code_hash) return { ok: false, reason: 'not_found' };
    if (!doc.deleted_at) return { ok: false, reason: 'not_deleted' };

    const restored = await Sticker.findByIdAndUpdate(
      id,
      { $set: { deleted_at: null, recovered_at: new Date() } },
      { new: true }
    ).select(PUBLIC_QR_FIELDS).lean();

    return { ok: true, data: toPublicQr(restored) };
  }
}

module.exports = QrModel;
