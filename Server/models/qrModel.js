const crypto = require('crypto');
const Sticker = require('./schemas/Sticker');
const ChatSession = require('./schemas/ChatSession');
const ChatMessage = require('./schemas/ChatMessage');
const Alert = require('./schemas/Alert');
const User = require('./schemas/User');
const { normalizePhone, isSamePhone } = require('../utils/phone');
const {
  ID_SCHEME_VERSION: ID_SCHEME_VERSION_V2,
  generateRecoveryCodeV2,
  deriveStickerIdV2,
  hashRecoveryCodeV2,
  isValidCodeFormat: isValidCodeFormatV2,
} = require('../services/stickerCrypto');
const { computePinnedQrParams, renderPinnedQrPng, ENCODER_NAME, ENCODER_VERSION, DEFAULT_MODULE_SIZE_PX, DEFAULT_MARGIN_MODULES } = require('../services/qrPinning');

// v2 stickers resolve to https://<host>/<id> — same public URL shape v1 uses
// (see helpers.ts qrFullUrl) — kept identical so scanning behaves the same
// regardless of scheme. Matches the APP_URL convention used everywhere else
// server-side (alertController, chatController, notificationController, ...).
// Read once at issuance and stored verbatim on the row (qr_payload) — a later
// change to APP_URL must never alter what an already-issued sticker encodes.
const QR_HOST = (process.env.APP_URL || 'https://rapiqr.worthitellp.workers.dev').replace(/\/+$/, '');

const DUPLICATE_ERROR_CODES = ['E11000', '11000'];

function isDuplicateError(err) {
  return err && DUPLICATE_ERROR_CODES.some((code) => String(err.code) === code || String(err.errmsg || '').includes('duplicate key'));
}

function getDuplicateDetails(err) {
  const msg = String(err.errmsg || '');
  const match = msg.match(/category:\s*(\w+),\s*normalized_phone_number:\s*(\S+)/);
  if (match) return { category: match[1], phone: match[2] };
  const match2 = msg.match(/normalized_phone_number:\s*(\S+)/);
  return match2 ? { phone: match2[1] } : null;
}

// Fields safe to return from the PUBLIC scan/activate/record-scan endpoints —
// deliberately excludes user_id/name/assigned_to/vehicle_number/details, which
// hold the owner's PII (phone, email, address, blood group, emergency
// contacts). Sticker merges the old qr_codes + products tables into one
// document; without this whitelist, an unauthenticated caller who knows a
// sticker's ID could pull a stranger's medical/contact details straight off
// GET /api/qr/:id or the activate/scan response.
const PUBLIC_QR_FIELDS = '_id client_id status scans_count last_scanned_at template_name fg_color bg_color category created_at recovered_at';

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
    // Set once by _restoreDeletedSticker on a recovery-code restore — lets the
    // scan page flag that this sticker's record was deleted and brought back,
    // so a finder/owner knows to re-verify the details rather than trust them
    // as still-current.
    recovered_at: doc.recovered_at || null,
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
 * and should never claim personal ownership of customer stickers
 */
async function resolveOwnerId(userId, ownerPhone) {
  if (userId) {
    try {
      const account = await User.findById(userId).select('phone_number role').lean();
      if (account && account.role !== 'admin') return userId;
    } catch (err) {
      console.error('QrModel.resolveOwnerId Error:', err);
    }
  }

  if (ownerPhone) {
    try {
      const digits = String(ownerPhone).replace(/\D/g, '');
      const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
      if (last10.length >= 7) {
        const user = await User.findOne({
          role: { $ne: 'admin' },
          $or: [
            { phone_number: ownerPhone },
            { phone_number: digits },
            { phone_number: new RegExp(`${last10.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) },
          ],
        }).select('_id').lean();
        if (user) return user._id;
      }
    } catch (err) {
      console.error('QrModel.resolveOwnerId phone match Error:', err);
    }
  }

  return null;
}

function buildStickerIdFilter(qrId) {
  if (!qrId) return { _id: null };
  const raw = String(qrId).trim().replace(/^[#]/, '');
  const lower = raw.toLowerCase();
  const upper = raw.toUpperCase();
  // Strip hyphens so UUID-format IDs (56FC77C2-312C-...) match hex-only stored _ids
  const hex = raw.replace(/-/g, '').toLowerCase();

  const conditions = [
    { _id: raw },
    { _id: lower },
    { _id: upper },
    { client_id: raw },
    { client_id: upper },
    { client_id: lower },
  ];

  // Match UUID or hex-prefix: 56FC77C2-312C-... or 56fc77c2312c... or short 8-hex prefix
  if (/^[0-9a-f]{6,}$/i.test(hex)) {
    conditions.push({ _id: new RegExp(`^${hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') });
  }

  return {
    deleted_at: null,
    $or: conditions,
  };
}

class QrModel {
  /**
   * Admin fleet view — owner info is on the same document now. Excludes soft-deleted stickers.
   */
  static async getAll(limit = 100) {
    try {
      const docs = await Sticker.find({ deleted_at: null }).sort({ created_at: -1 }).limit(limit).lean();
      return docs.map((doc) => {
        let recoveryCode = doc.recovery_code;
        if (!recoveryCode) {
          recoveryCode = generateRecoveryCode();
          const codeHash = hashRecoveryCode(recoveryCode);
          Sticker.updateOne(
            { _id: doc._id },
            { $set: { recovery_code: recoveryCode, recovery_code_hash: codeHash } }
          ).catch((err) => console.error('Failed to backfill recovery_code on sticker:', doc._id, err));
        }

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
          owner_phone: doc.details?.ownerPhone || doc.phone_number || null,
          owner_email: doc.details?.ownerEmail || null,
          owner_name: doc.name || doc.assigned_to || doc.details?.ownerName || null,
          notes: doc.details?.notes || null,
          product_status: doc.status,
          recovery_code: recoveryCode,
        };
      });
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
      const filter = buildStickerIdFilter(qrId);
      const doc = await Sticker.findOne(filter).select(PUBLIC_QR_FIELDS).lean();
      return toPublicQr(doc);
    } catch (err) {
      console.error('QrModel.getById Error:', err);
      return null;
    }
  }

  /**
   * Find by recovery code (recovery page).
   */
  static async getByRecoveryCode(plainCode) {
    try {
      const codeHash = hashRecoveryCode(plainCode);
      const doc = await Sticker.findOne({ recovery_code_hash: codeHash, deleted_at: null })
        .select(PUBLIC_QR_FIELDS)
        .lean();
      return toPublicQr(doc);
    } catch (err) {
      console.error('QrModel.getByRecoveryCode Error:', err);
      return null;
    }
  }

  /**
   * Create/Mint QR code (admin batch generator).
   */
  static async save(qrData) {
    try {
      const id = qrData.id || require('crypto').randomBytes(8).toString('hex');
      const rawRecoveryCode = qrData.recoveryCode || generateRecoveryCode();
      const codeHash = hashRecoveryCode(rawRecoveryCode);
      const category = qrData.category || 'car';
      const ownerPhone = qrData.ownerPhone || qrData.phone_number || qrData.owner_phone || null;
      const normalizedPhone = ownerPhone ? normalizePhone(ownerPhone) : null;

      const doc = await Sticker.create({
        _id: id,
        client_id: qrData.clientId || `CL${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`,
        status: qrData.status || 'inactive',
        template_name: qrData.template || 'Standard Tag',
        fg_color: qrData.fg || '000000',
        bg_color: qrData.bg || 'FFFFFF',
        category,
        phone_number: ownerPhone,
        normalized_phone_number: normalizedPhone,
        recovery_code: rawRecoveryCode,
        recovery_code_hash: codeHash,
        created_at: qrData.createdAt || new Date(),
      });

      return { ...toPublicQr(doc), recoveryCode: rawRecoveryCode };
    } catch (err) {
      if (isDuplicateError(err)) {
        const dup = getDuplicateDetails(err);
        const errObj = new Error(`A tag with phone number ${dup?.phone || 'unknown'} already exists in category ${dup?.category || category || 'car'}`);
        errObj.code = 'DUPLICATE_PHONE';
        throw errObj;
      }
      console.error('QrModel.save Error:', err);
      return null;
    }
  }

  /**
   * Create/Mint QR code — id-scheme v2: the server generates the recovery
   * code AND derives the sticker id from it (never the reverse, and never a
   * client-supplied id/code — see Server/services/stickerCrypto.js for why
   * the derivation must be server-authoritative to mean anything). QR
   * generation parameters are computed once here and pinned onto the row
   * forever — see Server/services/qrPinning.js.
   */
  static async saveV2(qrData = {}) {
    const category = qrData.category || 'car';
    try {
      const recoveryCode = generateRecoveryCodeV2();
      const id = deriveStickerIdV2(recoveryCode);
      const codeHash = hashRecoveryCodeV2(recoveryCode);
      const ownerPhone = qrData.ownerPhone || null;
      const normalizedPhone = ownerPhone ? normalizePhone(ownerPhone) : null;
      const fgColor = qrData.fg || '000000';
      const bgColor = qrData.bg || 'FFFFFF';

      const qrPayload = `${QR_HOST}/${id}`;
      const { qrVersion, qrEccLevel, qrMaskPattern } = computePinnedQrParams(qrPayload);
      const pinned = {
        qrVersion,
        qrEccLevel,
        qrMaskPattern,
        moduleSizePx: DEFAULT_MODULE_SIZE_PX,
        marginModules: DEFAULT_MARGIN_MODULES,
        fgColorHex: `#${fgColor}`,
        bgColorHex: `#${bgColor}`,
      };
      const { sha256 } = await renderPinnedQrPng(qrPayload, pinned);

      const doc = await Sticker.create({
        _id: id,
        id_scheme_version: ID_SCHEME_VERSION_V2,
        client_id: qrData.clientId || `CL${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        status: qrData.status || 'inactive',
        template_name: qrData.template || 'Standard Tag',
        fg_color: fgColor,
        bg_color: bgColor,
        category,
        phone_number: ownerPhone,
        normalized_phone_number: normalizedPhone,
        recovery_code: recoveryCode,
        recovery_code_hash: codeHash,
        qr_payload: qrPayload,
        qr_version: qrVersion,
        qr_ecc_level: qrEccLevel,
        qr_mask_pattern: qrMaskPattern,
        module_size_px: pinned.moduleSizePx,
        margin_modules: pinned.marginModules,
        encoder_name: ENCODER_NAME,
        encoder_version: ENCODER_VERSION,
        rendered_image_sha256: sha256,
        created_at: qrData.createdAt || new Date(),
      });

      return {
        ...toPublicQr(doc),
        recoveryCode,
        idSchemeVersion: ID_SCHEME_VERSION_V2,
        qrPayload,
        qrVersion,
        qrEccLevel,
        qrMaskPattern,
        moduleSizePx: pinned.moduleSizePx,
        marginModules: pinned.marginModules,
      };
    } catch (err) {
      if (isDuplicateError(err)) {
        const dup = getDuplicateDetails(err);
        const errObj = new Error(`A tag with phone number ${dup?.phone || 'unknown'} already exists in category ${dup?.category || category}`);
        errObj.code = 'DUPLICATE_PHONE';
        throw errObj;
      }
      console.error('QrModel.saveV2 Error:', err);
      return null;
    }
  }

  /**
   * Code-only recovery for id-scheme v2 stickers — no sticker id needed from
   * the caller at all, unlike v1's restoreByRecoveryCode. The recovery code
   * alone derives the id, and the QR is re-rendered through the EXACT pinned
   * parameters recorded at issuance, then hash-checked against the image
   * recorded at issuance before anything is served — see qrPinning.js.
   *
   * `not_found` deliberately covers "no such code" so the response can't be
   * used to enumerate valid codes.
   */
  static async recoverByCodeV2(rawRecoveryCode) {
    if (!rawRecoveryCode || !isValidCodeFormatV2(rawRecoveryCode)) {
      return { ok: false, reason: 'invalid_format' };
    }

    const id = deriveStickerIdV2(rawRecoveryCode);
    const doc = await Sticker.findById(id)
      .select('+recovery_code_hash id_scheme_version deleted_at category normalized_phone_number '
        + 'qr_payload qr_version qr_ecc_level qr_mask_pattern module_size_px margin_modules '
        + 'fg_color bg_color encoder_name encoder_version rendered_image_sha256 '
        + 'status client_id template_name scans_count last_scanned_at created_at recovered_at details.activatedAt')
      .lean();

    if (!doc || doc.id_scheme_version !== ID_SCHEME_VERSION_V2) return { ok: false, reason: 'not_found' };

    // Should be unreachable if derivation is correct — the id lookup above
    // already matched. Treated as an integrity failure, not a normal
    // "wrong code" outcome, since it means the derivation path itself is broken.
    const expectedHash = hashRecoveryCodeV2(rawRecoveryCode);
    if (!doc.recovery_code_hash || expectedHash !== doc.recovery_code_hash) {
      return { ok: false, reason: 'hash_mismatch' };
    }

    // Recompute the canonical image through the EXACT parameters pinned at
    // issuance and verify it against the hash recorded then. A mismatch means
    // the pinned encoder produced different bytes than at issuance — abort
    // rather than silently serve a "close enough" image.
    const { buffer, sha256 } = await renderPinnedQrPng(doc.qr_payload, {
      qrVersion: doc.qr_version,
      qrEccLevel: doc.qr_ecc_level,
      qrMaskPattern: doc.qr_mask_pattern,
      moduleSizePx: doc.module_size_px,
      marginModules: doc.margin_modules,
      fgColorHex: `#${doc.fg_color}`,
      bgColorHex: `#${doc.bg_color}`,
    });

    if (sha256 !== doc.rendered_image_sha256) {
      return { ok: false, reason: 'integrity_failure' };
    }

    let restoredData = null;
    if (doc.deleted_at) {
      const restoreResult = await QrModel._restoreDeletedSticker(id, doc);
      if (!restoreResult.ok) return restoreResult;
      restoredData = restoreResult.data;
    }

    return {
      ok: true,
      data: restoredData || toPublicQr(doc),
      imageBase64: buffer.toString('base64'),
      imageSha256: sha256,
    };
  }

  /**
   * Activate QR Code — writes the qr-side status and ownership/details in one atomic update.
   */
  static async activate(qrId, activationData) {
    const filter = buildStickerIdFilter(qrId);
    let current = await Sticker.findOne(filter).select('_id details user_id category').lean();
    if (!current) {
      // Scanned tag that was never persisted (e.g. printed before the backend
      // write completed, or restored from a partially-synced client). Register
      // it on the fly so the activation succeeds instead of 404/500ing.
      const rawId = String(qrId).trim().replace(/^[#]/, '');
      const rawRecoveryCode = generateRecoveryCode();
      try {
        const created = await Sticker.create({
          _id: rawId,
          client_id: `CL${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          status: 'inactive',
          category: activationData.category || 'car',
          recovery_code: rawRecoveryCode,
          recovery_code_hash: hashRecoveryCode(rawRecoveryCode),
        });
        current = { _id: created._id, details: created.details || {}, user_id: null, category: created.category };
      } catch (err) {
        // The id already exists but failed the live filter above — that's a
        // soft-deleted sticker, which is only restorable via recovery code.
        if (isDuplicateError(err)) {
          throw new Error(`QR code ${qrId} not found`);
        }
        throw err;
      }
    }

    const update = { status: 'active' };
    let normalizedPhone = null;

    if (activationData.ownerName || activationData.ownerPhone || activationData.notes || activationData.message) {
      const requestedUserId = activationData.userId || activationData.user_id || null;
      const ownerId = await resolveOwnerId(requestedUserId, activationData.ownerPhone);

      const details = { ...(current.details || {}) };
      if (activationData.ownerPhone) {
        details.ownerPhone = activationData.ownerPhone;
        update.phone_number = activationData.ownerPhone;
        normalizedPhone = normalizePhone(activationData.ownerPhone);
        update.normalized_phone_number = normalizedPhone;
      }
      if (activationData.ownerEmail) details.ownerEmail = activationData.ownerEmail;
      if (activationData.notes) details.notes = activationData.notes;
      if (activationData.message) details.notes = activationData.message;
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
      if (activationData.vehicleNumber) update.vehicle_number = activationData.vehicleNumber;
      update.user_id = ownerId || current.user_id || null;
    }

    try {
      const doc = await Sticker.findByIdAndUpdate(current._id, { $set: update }, { new: true })
        .select(PUBLIC_QR_FIELDS)
        .lean();
      return toPublicQr(doc);
    } catch (err) {
      if (isDuplicateError(err)) {
        const dup = getDuplicateDetails(err);
        const errObj = new Error(`A tag with phone number ${dup?.phone || 'unknown'} already exists in category ${dup?.category || current.category || 'car'}`);
        errObj.code = 'DUPLICATE_PHONE';
        throw errObj;
      }
      throw err;
    }
  }

  /**
   * Increment Scan Count — atomic, avoiding the read-then-write race the old
   * Postgres version had between fetching scans_count and writing it back.
   */
  static async recordScan(qrId) {
    try {
      if (!qrId) return null;
      const doc = await Sticker.findOneAndUpdate(
        buildStickerIdFilter(qrId),
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
    * Returns null when the sticker is not found, so the
    * controller can return 404 instead of 500.
   */
  static async delete(qrId) {
    const target = await Sticker.findOne(buildStickerIdFilter(qrId)).select('_id').lean();
    if (!target) {
      return null;
    }
    const realId = target._id;

    const sessions = await ChatSession.find({ qr_code_id: realId }).select('_id').lean();
    const sessionIds = sessions.map((s) => s._id);
    if (sessionIds.length > 0) {
      await ChatMessage.deleteMany({ session_id: { $in: sessionIds } });
      await ChatSession.deleteMany({ qr_code_id: realId });
    }

    await Alert.deleteMany({ sticker_id: realId });

    const doc = await Sticker.findByIdAndUpdate(
      realId,
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
   *
   * Restore re-introduces the sticker's (category, phone) into the live set,
   * so it must reject if another non-deleted sticker already holds that slot
   * (soft-delete freed it; another tag may have taken it since).
   */
  static async restoreByRecoveryCode(id, rawRecoveryCode) {
    if (!id || !rawRecoveryCode) return { ok: false, reason: 'missing_fields' };

    const doc = await Sticker.findById(id).select('+recovery_code_hash deleted_at category normalized_phone_number details.activatedAt').lean();
    if (!doc || !doc.recovery_code_hash) return { ok: false, reason: 'not_found' };
    if (hashRecoveryCode(rawRecoveryCode) !== doc.recovery_code_hash) return { ok: false, reason: 'not_found' };

    return QrModel._restoreDeletedSticker(id, doc);
  }

  /**
   * Owner self-service restore with NO recovery code — the caller only needs
   * to be signed in as the account this sticker is (still) linked to.
   * `user_id` survives a soft-delete untouched (see QrModel.delete), so
   * "was this yours" is exactly `sticker.user_id === the logged-in user`.
   * Works whether the sticker was deleted by the owner themselves or by an
   * admin — either way the rightful owner can bring it back with just the ID.
   */
  static async restoreOwnedByUser(id, userId) {
    if (!id || !userId) return { ok: false, reason: 'missing_fields' };

    const doc = await Sticker.findById(id).select('deleted_at category normalized_phone_number user_id details.activatedAt').lean();
    if (!doc) return { ok: false, reason: 'not_found' };
    if (!doc.user_id || String(doc.user_id) !== String(userId)) return { ok: false, reason: 'not_owner' };

    return QrModel._restoreDeletedSticker(id, doc);
  }

  /**
   * Shared restore mechanics once the caller has already proven the right to
   * restore `id` (by recovery code or by ownership) — re-checks it's actually
   * deleted, re-checks the (category, phone) slot is still free (soft-delete
   * freed it; another tag may have taken it since), then clears deleted_at.
   *
   * QrModel.delete() forces status to 'inactive' on every soft-delete so a
   * deleted sticker never reads as scannable — but that means the sticker's
   * PRE-delete status is gone by the time it gets here. `details.activatedAt`
   * is set once at first activation and is never touched by delete(), so it's
   * the one surviving signal of "this sticker was already registered" — used
   * to flip status back to 'active' on restore instead of leaving the owner's
   * recovered sticker looking unregistered and re-prompting for phone/details
   * on the next scan.
   */
  static async _restoreDeletedSticker(id, doc) {
    if (!doc.deleted_at) return { ok: false, reason: 'not_deleted' };

    if (doc.normalized_phone_number) {
      const conflict = await Sticker.findOne({
        _id: { $ne: id },
        deleted_at: null,
        category: doc.category || 'car',
        normalized_phone_number: doc.normalized_phone_number,
      }).select('_id').lean();
      if (conflict) return { ok: false, reason: 'duplicate_phone' };
    }

    const wasAlreadyRegistered = Boolean(doc.details?.activatedAt);

    try {
      const restored = await Sticker.findByIdAndUpdate(
        id,
        {
          $set: {
            deleted_at: null,
            recovered_at: new Date(),
            ...(wasAlreadyRegistered ? { status: 'active' } : {}),
          },
        },
        { new: true }
      ).select(PUBLIC_QR_FIELDS).lean();

      return { ok: true, data: toPublicQr(restored) };
    } catch (err) {
      if (isDuplicateError(err)) return { ok: false, reason: 'duplicate_phone' };
      throw err;
    }
  }
}

module.exports = QrModel;
