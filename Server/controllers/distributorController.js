const DistributorModel = require('../models/distributorModel');
const UserModel = require('../models/userModel');
const { logger } = require('../middleware/loggerMiddleware');
const { ADMIN_EMAIL } = require('../middleware/authMiddleware');
const { sendServerError } = require('../utils/httpErrors');
const { logAuditEvent } = require('../services/auditService');
const SecurityEventTypes = require('../utils/securityEventTypes');

const FIELD_MAX = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAdminCaller(user) {
  return user?.role === 'admin' || String(user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

class DistributorController {
  /** POST /api/distributors — submit a partner/franchise application */
  static async apply(req, res) {
    try {
      const { userName, userEmail, phone, city, business, tier } = req.body || {};
      if (!userName || !userEmail || !phone || !city || !business || !tier) {
        return res.status(400).json({ success: false, error: 'userName, userEmail, phone, city, business and tier are required' });
      }
      if ([userName, userEmail, phone, city, business, tier].some((v) => typeof v !== 'string')) {
        return res.status(400).json({ success: false, error: 'All fields must be text values' });
      }

      const clean = {
        userName: userName.trim(),
        userEmail: userEmail.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        business: business.trim(),
        tier: tier.trim(),
      };
      if (Object.values(clean).some((v) => !v || v.length > FIELD_MAX)) {
        return res.status(400).json({ success: false, error: `Every field is required and must be at most ${FIELD_MAX} characters` });
      }
      if (!EMAIL_RE.test(clean.userEmail)) {
        return res.status(400).json({ success: false, error: 'Enter a valid email address' });
      }

      // An admin adding a partner from the console is filing the application ON
      // BEHALF of someone else — binding it to the admin's own account would let
      // an approval rewrite the admin's role. Link to the applicant's own account
      // by email instead (null until they sign up; approval re-checks).
      let userId = req.user?.id;
      if (isAdminCaller(req.user)) {
        userId = (await UserModel.findByEmail(clean.userEmail))?.id || null;
      }

      const app = await DistributorModel.create({ userId, ...clean });
      logger.event('DISTRIBUTOR', '🤝', `Partner application ${app.id} submitted by ${clean.userEmail}`);
      return res.json({ success: true, data: app });
    } catch (err) {
      logger.error('DISTRIBUTOR_APPLY', 'Failed to save distributor application', err);
      return sendServerError(res, err);
    }
  }

  /** GET /api/distributors — admin: list all applications */
  static async list(req, res) {
    try {
      const data = await DistributorModel.getAll();
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('DISTRIBUTOR_LIST', 'Failed to fetch distributor applications', err);
      return sendServerError(res, err);
    }
  }

  /**
   * GET /api/distributors/me — the logged-in user's own application status.
   *
   * Looks up strictly by the caller's own identity (user_id, falling back to
   * their account email) — a query-string `identifier` used to be accepted
   * here and passed straight to the lookup, which let any signed-in user read
   * a stranger's application (business name, city, phone, tier) just by
   * guessing/knowing their email or phone number.
   */
  static async myStatus(req, res) {
    try {
      const app = (await DistributorModel.getByUserId(req.user.id))
        || (await DistributorModel.getByUser(req.user.email));
      return res.json({ success: true, data: app });
    } catch (err) {
      logger.error('DISTRIBUTOR_STATUS', 'Failed to fetch distributor application status', err);
      return sendServerError(res, err);
    }
  }

  /**
   * GET /api/distributors/me/dashboard — the partner's application, allocated
   * stock and what happened to it. The role is read from the database, not the
   * JWT: a token minted before approval (or kept after a rejection) must not
   * decide who sees partner data.
   */
  static async dashboard(req, res) {
    try {
      const account = await UserModel.findById(req.user.id);
      if (!account || account.role !== 'distributor') {
        return res.status(403).json({ success: false, error: 'Forbidden: an approved distributor account is required' });
      }
      const data = await DistributorModel.getDashboard(req.user.id);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('DISTRIBUTOR_DASHBOARD', 'Failed to build distributor dashboard', err);
      return sendServerError(res, err);
    }
  }

  /** PATCH /api/distributors/:id/status — admin: approve/reject */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body || {};
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: "status must be 'approved' or 'rejected'" });
      }
      if (notes != null && (typeof notes !== 'string' || notes.length > 1000)) {
        return res.status(400).json({ success: false, error: 'notes must be text of at most 1000 characters' });
      }

      const app = await DistributorModel.updateStatus(id, status, notes);
      if (!app) return res.status(404).json({ success: false, error: 'Application not found' });

      logger.event('DISTRIBUTOR', status === 'approved' ? '✅' : '❌', `Application ${id} ${status} by admin ${req.user.email}`);
      // Approval/rejection grants or revokes the distributor role — a privilege change.
      await logAuditEvent({
        eventType: SecurityEventTypes.ROLE_CHANGED,
        actorType: 'ADMIN',
        req,
        resourceType: 'DistributorApplication',
        resourceId: String(id),
        metadata: { action: `application_${status}`, targetUserId: app.userId },
      });
      return res.json({ success: true, data: app });
    } catch (err) {
      logger.error('DISTRIBUTOR_STATUS_UPDATE', `Failed to update distributor application ${req.params.id}`, err);
      return sendServerError(res, err);
    }
  }

  /**
   * POST /api/distributors/:id/allocate — admin: hand stock to an approved partner.
   * body: { count: 1..500, category?: string, printedOnly?: boolean (default true) }
   */
  static async allocate(req, res) {
    try {
      const { id } = req.params;
      const { count, category, printedOnly } = req.body || {};
      const n = Number(count);
      if (!Number.isInteger(n) || n < 1 || n > 500) {
        return res.status(400).json({ success: false, error: 'count must be a whole number between 1 and 500' });
      }
      if (category != null && (typeof category !== 'string' || category.length > 40)) {
        return res.status(400).json({ success: false, error: 'category must be text of at most 40 characters' });
      }

      const result = await DistributorModel.allocateStickers(id, {
        count: n,
        category: category || null,
        printedOnly: printedOnly !== false,
      });
      if (!result.ok) {
        const notFound = result.reason === 'not_found';
        return res.status(notFound ? 404 : 409).json({
          success: false,
          error: notFound ? 'Application not found' : 'Stickers can only be allocated to an approved partner with an account',
        });
      }

      await logAuditEvent({
        eventType: SecurityEventTypes.DATA_UPDATED,
        actorType: 'ADMIN',
        req,
        resourceType: 'DistributorApplication',
        resourceId: String(id),
        metadata: { action: 'allocate_stickers', requested: n, allocated: result.allocated, category: category || null, printedOnly: printedOnly !== false },
      });
      logger.event('DISTRIBUTOR', '📦', `Allocated ${result.allocated} stickers to application ${id} by admin ${req.user.email}`);
      return res.json({ success: true, data: { allocated: result.allocated, remainingPool: result.remainingPool } });
    } catch (err) {
      logger.error('DISTRIBUTOR_ALLOCATE', `Failed to allocate stickers to ${req.params.id}`, err);
      return sendServerError(res, err);
    }
  }
}

module.exports = DistributorController;
