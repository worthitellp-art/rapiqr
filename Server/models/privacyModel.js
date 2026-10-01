const Consent = require('./schemas/Consent');
const PrivacyRequest = require('./schemas/PrivacyRequest');
const User = require('./schemas/User');
const { logger } = require('../middleware/loggerMiddleware');

function toConsentApi(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    purpose: doc.purpose,
    dataCategories: doc.data_categories || [],
    noticeVersion: doc.notice_version,
    status: doc.status,
    source: doc.source,
    createdAt: doc.created_at,
  };
}

function toRequestApi(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    type: doc.type,
    status: doc.status,
    reason: doc.reason,
    requestedAt: doc.requested_at,
    identityVerifiedAt: doc.identity_verified_at,
    fulfilledAt: doc.fulfilled_at,
    notes: doc.notes,
  };
}

class PrivacyModel {
  static get CONSENT_PURPOSES() {
    return Consent.PURPOSES;
  }

  /**
   * Record a new consent event (grant or withdrawal). Consent is append-only —
   * withdrawing doesn't edit the grant record, it adds a new WITHDRAWN one, so
   * the full history of what was agreed to and when survives.
   */
  static async recordConsent({ userId, purpose, status, dataCategories = [], noticeVersion, source, ipAddress }) {
    const doc = await Consent.create({
      user_id: userId,
      purpose,
      status,
      data_categories: dataCategories,
      notice_version: noticeVersion,
      source: source || 'privacy_dashboard',
      ip_address: ipAddress || null,
    });
    return toConsentApi(doc);
  }

  /**
   * Current status per purpose = latest record for that (user, purpose) pair.
   * Purposes with no record at all are reported as NOT_SET rather than omitted,
   * so the frontend can render every known purpose with a definite state.
   */
  static async getCurrentStatus(userId) {
    try {
      const docs = await Consent.find({ user_id: userId }).sort({ created_at: -1 }).lean();
      const latestByPurpose = new Map();
      for (const doc of docs) {
        if (!latestByPurpose.has(doc.purpose)) latestByPurpose.set(doc.purpose, doc);
      }
      return Consent.PURPOSES.map((purpose) => {
        const latest = latestByPurpose.get(purpose);
        return latest
          ? toConsentApi(latest)
          : { id: null, purpose, dataCategories: [], noticeVersion: null, status: 'NOT_SET', source: null, createdAt: null };
      });
    } catch (err) {
      logger.error('PRIVACY_CONSENT', 'PrivacyModel.getCurrentStatus failed', err);
      return [];
    }
  }

  static async createPrivacyRequest({ userId, type, reason }) {
    const doc = await PrivacyRequest.create({
      user_id: userId,
      type,
      reason: reason || null,
      // The caller already passed JWT verification to reach this endpoint —
      // that IS the identity check for a self-service request (task.md §9).
      status: 'IDENTITY_VERIFIED',
      identity_verified_at: new Date(),
    });
    return toRequestApi(doc);
  }

  static async markRequestFulfilled(requestId, notes) {
    const doc = await PrivacyRequest.findByIdAndUpdate(
      requestId,
      { $set: { status: 'FULFILLED', fulfilled_at: new Date(), notes: notes || null } },
      { new: true }
    ).lean();
    return toRequestApi(doc);
  }

  static async markRequestFailed(requestId, reason) {
    const doc = await PrivacyRequest.findByIdAndUpdate(
      requestId,
      { $set: { status: 'REVIEW', reason } },
      { new: true }
    ).lean();
    return toRequestApi(doc);
  }

  static async listOwnRequests(userId) {
    const docs = await PrivacyRequest.find({ user_id: userId }).sort({ requested_at: -1 }).lean();
    return docs.map(toRequestApi);
  }

  static async setNominee(userId, { name, relationship, contactPhone, contactEmail }) {
    const doc = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          nominee: {
            name: name || null,
            relationship: relationship || null,
            contact_phone: contactPhone || null,
            contact_email: contactEmail || null,
            set_at: new Date(),
          },
        },
      },
      { new: true }
    ).select('nominee').lean();
    return doc?.nominee || null;
  }

  static async getNominee(userId) {
    const doc = await User.findById(userId).select('nominee').lean();
    return doc?.nominee?.set_at ? doc.nominee : null;
  }
}

module.exports = PrivacyModel;
