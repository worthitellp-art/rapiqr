const Sticker = require('./schemas/Sticker');
const Alert = require('./schemas/Alert');
const { normalizePhone, isSamePhone } = require('../utils/phone');
const { logger } = require('../middleware/loggerMiddleware');

function isDuplicateError(err) {
  return err && (String(err.code) === '11000' || String(err.code) === 'E11000' || String(err.errmsg || '').includes('duplicate key'));
}

function duplicatePhoneError(phone, category) {
  const err = new Error(`A tag with phone number ${phone || 'unknown'} already exists in category ${category || 'car'}`);
  err.code = 'DUPLICATE_PHONE';
  return err;
}

/**
 * The ONLY fields that hold the registering owner's own phone number, and so the
 * only fields a dashboard may claim a sticker by.
 *
 * Deliberately excludes `assigned_to`, `vehicle_number` and `details.emergencyContacts`:
 *   - assigned_to / vehicle_number are free text and a number plate's digits used to
 *     substring-match real phone numbers, pulling strangers' stickers into a dashboard.
 *   - an emergency contact is by definition SOMEBODY ELSE (a relative, a garage). Claiming
 *     on it handed your sticker to whoever you listed as your emergency contact.
 */
const OWNER_PHONE_FIELDS = ['ownerPhone', 'phone', 'phoneNumber', 'owner_phone'];

/**
 * A sticker's owner phone lives in one of two places depending on how it got
 * there: `details.*` when set by the scan-page activation flow, or the
 * top-level `phone_number` when an admin pre-fills it at generation time
 * (see QrModel.save/GenerateTagModal — that path writes `phone_number`
 * directly, never `details.ownerPhone`). Missing the top-level field here
 * meant an admin-linked sticker could never be auto-claimed by a client
 * verifying that same number — this checks both.
 */
function ownerPhonesOf(sticker) {
  const details = sticker?.details || {};
  const fromDetails = OWNER_PHONE_FIELDS.map((field) => details?.[field]);
  return [...fromDetails, sticker?.phone_number].filter(Boolean);
}

/**
 * Sticker docs merge the old qr_codes + products tables. `user_id` is either
 * a plain ObjectId (unpopulated) or a populated User sub-document — this
 * normalizes both into a flat, string-keyed shape safe to hand to a caller
 * (and, importantly, comparable with === against a JWT's string user id).
 */
function toApi(doc) {
  if (!doc) return null;
  const owner = doc.user_id && typeof doc.user_id === 'object' ? doc.user_id : null;
  const userId = owner ? owner._id : doc.user_id;

  return {
    id: doc._id,
    qr_code_id: doc._id,
    status: doc.status,
    scans_count: doc.scans_count,
    last_scanned_at: doc.last_scanned_at,
    template_name: doc.template_name,
    fg_color: doc.fg_color,
    bg_color: doc.bg_color,
    category: doc.category,
    user_id: userId ? String(userId) : null,
    name: doc.name,
    assigned_to: doc.assigned_to,
    vehicle_number: doc.vehicle_number,
    details: doc.details || {},
    created_at: doc.created_at,
    profiles: owner ? {
      id: String(owner._id),
      email: owner.email,
      full_name: owner.full_name,
      phone_number: owner.phone_number,
      role: owner.role,
    } : null,
  };
}

function buildStickerIdFilter(productId) {
  if (!productId) return { _id: null };
  const raw = String(productId).trim().replace(/^[#]/, '');
  const lower = raw.toLowerCase();
  const upper = raw.toUpperCase();

  const conditions = [
    { _id: raw },
    { _id: lower },
    { _id: upper },
    { client_id: raw },
    { client_id: upper },
    { client_id: lower },
  ];

  // If 8-hex prefix or UUID short-code is passed (e.g. 1FBD68FC from 1fbd68fc-...)
  if (/^[0-9a-f]{6,12}$/i.test(raw)) {
    conditions.push({ _id: new RegExp(`^${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') });
  }

  return {
    deleted_at: null,
    $or: conditions,
  };
}

class ProductModel {
  /**
   * Admin-only: search stickers across ALL users by QR code id, name,
   * vehicle number, assigned-to, owner phone/email (from `details`), or the
   * linked account's own email/name/phone. Filtered in application code
   * since the searchable fields span both plain fields and a nested object.
   */
  static async searchAll(query, limit = 500) {
    try {
      const docs = await Sticker.find()
        .populate('user_id', 'email full_name phone_number role')
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      const rows = docs.map(toApi);
      const term = String(query || '').trim().toLowerCase();
      if (!term) return rows;

      const digits = term.replace(/\D/g, '');
      return rows.filter((p) => {
        const haystacks = [
          p.id, p.name, p.vehicle_number, p.assigned_to,
          p.details?.ownerPhone, p.details?.ownerEmail,
          p.profiles?.email, p.profiles?.full_name, p.profiles?.phone_number,
        ].filter(Boolean).map((v) => String(v).toLowerCase());

        const matchesText = haystacks.some((h) => h.includes(term));
        const matchesPhone = digits.length >= 4 && haystacks.some((h) => h.replace(/\D/g, '').includes(digits));
        return matchesText || matchesPhone;
      });
    } catch (err) {
      console.error('ProductModel.searchAll Error:', err);
      logger.error('DB_PRODUCT', 'ProductModel.searchAll failed', err);
      return [];
    }
  }

  /**
   * Fetch all stickers owned by a given user. Excludes soft-deleted stickers.
   */
  static async getAllByUser(userId) {
    try {
      const docs = await Sticker.find({ user_id: userId, deleted_at: null }).sort({ created_at: -1 }).lean();
      return docs.map(toApi);
    } catch (err) {
      console.error('ProductModel.getAllByUser Error:', err);
      logger.error('DB_PRODUCT', 'ProductModel.getAllByUser failed', err);
      return [];
    }
  }

  static async getByQrCodeId(qrCodeId) {
    return this.getById(qrCodeId);
  }

  /**
   * Link every UNCLAIMED sticker whose registered owner phone is this account's
   * verified phone number.
   *
   * Two rules make a sticker belong to exactly one dashboard:
   *
   *  1. Only unowned rows (plus admin-held or differently-phoned rows, see
   *     below) are eligible — claiming is one-way: unowned -> owned.
   *  2. Matching is exact on the last 10 digits, over owner-phone fields only
   *     (see OWNER_PHONE_FIELDS above).
   *
   * Ownership after that point moves only through an explicit transfer.
   */
  static async autoClaimByPhone(userId, userName, phone) {
    if (!userId) return [];
    if (!normalizePhone(phone)) return [];

    try {
      const docs = await Sticker.find().populate('user_id', 'phone_number role').lean();

      const matches = docs.filter((p) => {
        const ownerId = p.user_id?._id || p.user_id;
        if (ownerId && String(ownerId) === String(userId)) return false;

        const matchesOwnerPhone = ownerPhonesOf(p).some((candidate) => isSamePhone(candidate, phone));
        if (!matchesOwnerPhone) return false;

        const isUnowned = !p.user_id;
        const isCurrentOwnerAdmin = p.user_id?.role === 'admin';
        const currentOwnerPhone = p.user_id?.phone_number;
        const isCurrentOwnerDifferentPhone = !isSamePhone(currentOwnerPhone, phone);

        return isUnowned || isCurrentOwnerAdmin || isCurrentOwnerDifferentPhone;
      });

      const claimed = [];
      for (const p of matches) {
        const newAssigned = (userName && userName !== 'Self') ? userName : (p.assigned_to && p.assigned_to !== 'Self' ? p.assigned_to : 'Self');
        const updated = await Sticker.findByIdAndUpdate(
          p._id,
          { $set: { user_id: userId, assigned_to: newAssigned } },
          { new: true }
        ).lean();
        if (updated) claimed.push(toApi(updated));
      }
      return claimed;
    } catch (err) {
      console.error('ProductModel.autoClaimByPhone Error:', err);
      logger.error('DB_PRODUCT', 'ProductModel.autoClaimByPhone failed', err);
      return [];
    }
  }

  /**
   * Link specific stickers (by id) to a user account — the exact tag(s) a
   * paid order is owed (Order.stickers, auto-minted at checkout — see
   * OrderModel.generateStickersForOrder), claimed once that order's phone
   * number is verified (see AuthController.verifyPhoneOtp). Unlike
   * autoClaimByPhone this never scans/guesses by phone string — the order
   * itself already proves which sticker(s) belong to this purchase — but it
   * keeps the same one-way ownership-transfer safety: only an unowned or
   * admin-held sticker moves, so a sticker some other real account already
   * claimed (or self-activated) is never silently reassigned.
   */
  static async claimStickersByIds(userId, userName, stickerIds) {
    if (!userId || !Array.isArray(stickerIds) || stickerIds.length === 0) return [];

    try {
      const docs = await Sticker.find({ _id: { $in: stickerIds }, deleted_at: null })
        .populate('user_id', 'role')
        .lean();

      const claimed = [];
      for (const p of docs) {
        const ownerId = p.user_id?._id || p.user_id;
        if (ownerId && String(ownerId) === String(userId)) continue;

        const isUnowned = !p.user_id;
        const isCurrentOwnerAdmin = p.user_id?.role === 'admin';
        if (!isUnowned && !isCurrentOwnerAdmin) continue;

        const newAssigned = (userName && userName !== 'Self') ? userName : (p.assigned_to && p.assigned_to !== 'Self' ? p.assigned_to : 'Self');
        const updated = await Sticker.findByIdAndUpdate(
          p._id,
          { $set: { user_id: userId, assigned_to: newAssigned } },
          { new: true }
        ).lean();
        if (updated) claimed.push(toApi(updated));
      }
      return claimed;
    } catch (err) {
      console.error('ProductModel.claimStickersByIds Error:', err);
      logger.error('DB_PRODUCT', 'ProductModel.claimStickersByIds failed', err);
      return [];
    }
  }

  /**
   * Admin support view: which stickers register this phone as their owner phone,
   * and who (if anyone) currently holds them.
   */
  static async findByOwnerPhone(phone) {
    if (!normalizePhone(phone)) return [];
    try {
      const docs = await Sticker.find()
        .populate('user_id', 'email full_name phone_number role')
        .sort({ created_at: -1 })
        .lean();
      return docs
        .filter((doc) => ownerPhonesOf(doc).some((candidate) => isSamePhone(candidate, phone)))
        .map(toApi);
    } catch (err) {
      console.error('ProductModel.findByOwnerPhone Error:', err);
      logger.error('DB_PRODUCT', 'ProductModel.findByOwnerPhone failed', err);
      return [];
    }
  }

  static async getById(productId) {
    try {
      if (typeof productId !== 'string' && typeof productId !== 'number') return null;
      const doc = await Sticker.findOne(buildStickerIdFilter(productId)).lean();
      return toApi(doc);
    } catch (err) {
      console.error(`ProductModel.getById (${productId}) Error:`, err);
      logger.error('DB_PRODUCT', `ProductModel.getById failed (${productId})`, err);
      return null;
    }
  }

  /**
   * Edit sticker details. Scalar fields update directly; everything else
   * (address, bloodGroup, allergies, ownerPhone, ownerEmail, ...) merges into
   * `details` so we never clobber fields the caller didn't send.
   */
  static async updateDetails(productId, updates) {
    try {
      const current = await Sticker.findOne(buildStickerIdFilter(productId)).lean();
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

      // Keep the indexable top-level phone fields in sync with the editable
      // details.ownerPhone, so the (category, normalized_phone_number) unique
      // index actually guards the edit path (findByIdAndUpdate skips pre('save')).
      if (updates.ownerPhone !== undefined) {
        payload.phone_number = updates.ownerPhone || null;
        payload.normalized_phone_number = normalizePhone(updates.ownerPhone);
      }

      if (Object.keys(payload).length === 0) return toApi(current);

      // Reject a (category, phone) that another live sticker already holds,
      // excluding this sticker itself (updating your own row must not self-conflict).
      const effectiveCategory = payload.category !== undefined ? payload.category : current.category || 'car';
      const effectivePhone = payload.phone_number !== undefined ? payload.phone_number : (current.details?.ownerPhone || current.phone_number || null);
      const normalized = normalizePhone(effectivePhone);
      if (normalized) {
        const conflict = await Sticker.findOne({
          _id: { $ne: current._id },
          deleted_at: null,
          category: effectiveCategory,
          normalized_phone_number: normalized,
        }).select('_id').lean();
        if (conflict) {
          throw duplicatePhoneError(effectivePhone, effectiveCategory);
        }
      }

      const doc = await Sticker.findByIdAndUpdate(productId, { $set: payload }, { new: true }).lean();
      return toApi(doc);
    } catch (err) {
      if (isDuplicateError(err)) {
        // Race lost to the DB unique index after the pre-check above.
        throw duplicatePhoneError(updates.ownerPhone ?? current?.details?.ownerPhone ?? current?.phone_number, updates.category ?? current?.category ?? 'car');
      }
      throw err;
    }
  }

  /**
   * Replace the emergency contacts list for a sticker.
   * contacts: [{ name, phone }, ...]
   *
   * Returns `newlyAddedContacts` alongside the API row — the ones present in
   * this call but not in the sticker's PRIOR list — so a caller can WhatsApp
   * just the people who are actually new, not re-notify everyone already on
   * the list every time this dashboard panel re-saves it (see
   * ProductController.updateContacts / notificationService.notifyContactsAdded).
   */
  static async updateContacts(productId, contacts) {
    try {
      const current = await Sticker.findById(productId).select('details').lean();
      if (!current) return null;

      const priorPhones = new Set(
        (Array.isArray(current.details?.emergencyContacts) ? current.details.emergencyContacts : [])
          .map((c) => normalizePhone(c?.phone))
          .filter(Boolean)
      );
      const newlyAddedContacts = contacts.filter((c) => c?.phone && !priorPhones.has(normalizePhone(c.phone)));

      const mergedDetails = { ...(current.details || {}), emergencyContacts: contacts };
      const doc = await Sticker.findByIdAndUpdate(productId, { $set: { details: mergedDetails } }, { new: true }).lean();
      return { ...toApi(doc), newlyAddedContacts };
    } catch (err) {
      console.error(`ProductModel.updateContacts (${productId}) Error:`, err);
      logger.error('DB_PRODUCT', `ProductModel.updateContacts failed (${productId})`, err);
      return null;
    }
  }

  static async setStatus(productId, status) {
    try {
      const doc = await Sticker.findByIdAndUpdate(productId, { $set: { status } }, { new: true }).lean();
      return toApi(doc);
    } catch (err) {
      console.error(`ProductModel.setStatus (${productId}) Error:`, err);
      logger.error('DB_PRODUCT', `ProductModel.setStatus failed (${productId})`, err);
      return null;
    }
  }

  /**
   * Transfer ownership of a sticker to another registered account (by email).
   */
  static async transfer(productId, targetUserId, targetName) {
    try {
      const doc = await Sticker.findByIdAndUpdate(
        productId,
        { $set: { user_id: targetUserId, assigned_to: targetName || 'New Owner' } },
        { new: true }
      ).lean();
      return toApi(doc);
    } catch (err) {
      console.error(`ProductModel.transfer (${productId}) Error:`, err);
      logger.error('DB_PRODUCT', `ProductModel.transfer failed (${productId})`, err);
      return null;
    }
  }

  /**
   * Scan/alert history for a single sticker, newest first.
   */
  static async getHistory(productId, limit = 100) {
    try {
      const docs = await Alert.find({ sticker_id: productId })
        .select('type message reporter_phone location status created_at')
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();
      return docs.map((d) => ({
        id: String(d._id),
        type: d.type,
        message: d.message,
        reporter_phone: d.reporter_phone,
        location: d.location,
        status: d.status,
        created_at: d.created_at,
      }));
    } catch (err) {
      console.error(`ProductModel.getHistory (${productId}) Error:`, err);
      logger.error('DB_PRODUCT', `ProductModel.getHistory failed (${productId})`, err);
      return [];
    }
  }
}

module.exports = ProductModel;
