const DistributorApplication = require('./schemas/DistributorApplication');
const User = require('./schemas/User');

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
    // not just a status flag on the application row.
    if (status === 'approved' && doc.user_id) {
      await User.findByIdAndUpdate(doc.user_id, { $set: { role: 'distributor' } });
    }

    return toApi(doc);
  }
}

module.exports = DistributorModel;
