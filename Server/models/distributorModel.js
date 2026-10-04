const mongoose = require('mongoose');
const DistributorApplication = require('./schemas/DistributorApplication');
const User = require('./schemas/User');
const Sticker = require('./schemas/Sticker');
const { maskPhone } = require('../middleware/loggerMiddleware');

function toApi(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    userId: doc.user_id ? String(doc.user_id) : null,
    userName: doc.user_name,
    userEmail: doc.user_email,
    phone: doc.phone,
    city: doc.city,
    business: doc.business,
    tier: doc.tier,
    status: doc.status,
    notes: doc.notes,
    createdAt: doc.created_at,
    approvedAt: doc.approved_at,
  };
}

class DistributorModel {
  static async getAll() {
    const docs = await DistributorApplication.find().sort({ created_at: -1 }).lean();
    return docs.map(toApi);
  }

  static async getByUserId(userId) {
    if (!userId || (typeof userId !== 'string' && typeof userId !== 'number')) return null;
    const doc = await DistributorApplication.findOne({ user_id: String(userId) }).sort({ created_at: -1 }).lean();
    return toApi(doc);
  }

  // emailOrPhone is client-supplied (the public "apply" form and, historically,
  // a query param) — cast to a plain string before it can reach $or, otherwise
  // a value like {"$ne": null} matches every application in the collection
  // and leaks another applicant's business name/city/phone.
  static async getByUser(emailOrPhone) {
    if (!emailOrPhone || (typeof emailOrPhone !== 'string' && typeof emailOrPhone !== 'number')) return null;
    const value = String(emailOrPhone);
    const doc = await DistributorApplication.findOne({
      $or: [{ user_email: value }, { phone: value }],
    }).sort({ created_at: -1 }).lean();
    return toApi(doc);
  }

  static async create(appData) {
    const existing = await this.getByUser(appData.userEmail);
    if (existing) return existing;

    const id = 'DIST-' + Date.now().toString().slice(-6);
    const doc = await DistributorApplication.create({
      _id: id,
      user_id: appData.userId || null,
      user_name: appData.userName,
      user_email: appData.userEmail,
      phone: appData.phone,
      city: appData.city,
      business: appData.business,
      tier: appData.tier,
      status: 'pending',
    });

    return toApi(doc);
  }

  static async updateStatus(appId, status, notes) {
    const doc = await DistributorApplication.findByIdAndUpdate(
      appId,
      {
        $set: {
          status,
          notes: notes || null,
          approved_at: status === 'approved' ? new Date() : null,
        },
      },
      { new: true }
    ).lean();

    if (!doc) return null;

    // Approval grants the real distributor role on the account (task.md #17) —
    // not just a status flag on the application row. An application created from
    // the admin console has no user_id yet, so fall back to the account that
    // owns the applicant's email (if they have signed up).
    let userId = doc.user_id;
    if (!userId && doc.user_email) {
      const account = await User.findOne({ email: String(doc.user_email).trim().toLowerCase() }).select('_id').lean();
      userId = account?._id || null;
      if (userId) await DistributorApplication.updateOne({ _id: doc._id }, { $set: { user_id: userId } });
    }

    if (userId) {
      if (status === 'approved') {
        // Never touch an admin's role — an admin-created application used to be
        // bound to the admin's own account, and approving it overwrote that role.
        await User.updateOne({ _id: userId, role: { $ne: 'admin' } }, { $set: { role: 'distributor' } });
      } else if (status === 'rejected') {
        // Rejecting (or revoking) must take the privilege back, not just flip a flag.
        await User.updateOne({ _id: userId, role: 'distributor' }, { $set: { role: 'user' } });
      }
    }

    return toApi({ ...doc, user_id: userId });
  }

  /**
   * Admin: hand N unactivated, unowned stickers to an approved distributor.
   * The server picks the stock (oldest first) so the admin never has to copy
   * sticker ids around, and the guarded update means two concurrent
   * allocations can never give the same sticker to two partners.
   */
  static async allocateStickers(applicationId, { count, category = null, printedOnly = true }) {
    const app = await DistributorApplication.findById(applicationId).lean();
    if (!app) return { ok: false, reason: 'not_found' };
    if (app.status !== 'approved' || !app.user_id) return { ok: false, reason: 'not_approved' };

    const pool = {
      deleted_at: null,
      user_id: null,
      distributor_user_id: null,
      status: 'inactive',
      phone_number: null,
      'details.ownerPhone': null,
    };
    if (category) pool.category = String(category);
    if (printedOnly) pool.is_printed = true;

    const picked = await Sticker.find(pool).sort({ created_at: 1 }).limit(count).select('_id').lean();
    const ids = picked.map((s) => s._id);
    let allocated = 0;
    if (ids.length > 0) {
      const res = await Sticker.updateMany(
        { _id: { $in: ids }, distributor_user_id: null },
        { $set: { distributor_user_id: app.user_id, distributed_at: new Date() } }
      );
      allocated = res.modifiedCount || 0;
    }

    const remainingPool = await Sticker.countDocuments(pool);
    return { ok: true, allocated, remainingPool, userId: String(app.user_id) };
  }

  /**
   * A distributor's own dashboard: their application plus the stock allocated
   * to them and what became of it. Customer phones are masked, and the sticker
   * id is shortened to a reference — enough to reconcile with a customer, not
   * enough to act on the sticker.
   */
  static async getDashboard(userId) {
    const owner = new mongoose.Types.ObjectId(String(userId));
    const mine = { distributor_user_id: owner, deleted_at: null };

    const [application, allocated, activated, scanAgg, docs] = await Promise.all([
      this.getByUserId(userId),
      Sticker.countDocuments(mine),
      Sticker.countDocuments({ ...mine, status: 'active' }),
      Sticker.aggregate([{ $match: mine }, { $group: { _id: null, scans: { $sum: { $ifNull: ['$scans_count', 0] } } } }]),
      Sticker.find(mine)
        .sort({ 'details.activatedAt': -1, distributed_at: -1 })
        .limit(200)
        .select('_id category status name phone_number details.ownerPhone details.activatedAt scans_count distributed_at')
        .lean(),
    ]);

    return {
      application,
      stats: { allocated, activated, inStock: Math.max(0, allocated - activated), scans: scanAgg[0]?.scans || 0 },
      stickers: docs.map((d) => {
        const phone = d.details?.ownerPhone || d.phone_number || null;
        return {
          ref: String(d._id).slice(0, 8).toUpperCase(),
          category: d.category,
          status: d.status === 'active' ? 'active' : 'inactive',
          ownerName: d.name || null,
          ownerPhone: phone ? maskPhone(phone) : null,
          activatedAt: d.details?.activatedAt || null,
          scans: d.scans_count || 0,
          allocatedAt: d.distributed_at || null,
        };
      }),
    };
  }
}

module.exports = DistributorModel;
