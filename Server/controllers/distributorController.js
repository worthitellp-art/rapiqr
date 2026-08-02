const DistributorModel = require('../models/distributorModel');
const { logger } = require('../middleware/loggerMiddleware');

class DistributorController {
  /** POST /api/distributors — submit a partner/franchise application */
  static async apply(req, res) {
    try {
      const { userName, userEmail, phone, city, business, tier } = req.body || {};
      if (!userName || !userEmail || !phone || !city || !business || !tier) {
        return res.status(400).json({ success: false, error: 'userName, userEmail, phone, city, business and tier are required' });
      }

      const app = await DistributorModel.create({
        userId: req.user?.id,
        userName, userEmail, phone, city, business, tier,
      });
      logger.event('DISTRIBUTOR', '🤝', `Partner application ${app.id} submitted by ${userEmail}`);
      return res.json({ success: true, data: app });
    } catch (err) {
      logger.error('DISTRIBUTOR_APPLY', 'Failed to save distributor application', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** GET /api/distributors — admin: list all applications */
  static async list(req, res) {
    try {
      const data = await DistributorModel.getAll();
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('DISTRIBUTOR_LIST', 'Failed to fetch distributor applications', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /** GET /api/distributors/me — the logged-in user's own application status */
  static async myStatus(req, res) {
    try {
      const identifier = req.query.identifier || req.user?.email;
      const app = await DistributorModel.getByUser(identifier);
      return res.json({ success: true, data: app });
    } catch (err) {
      logger.error('DISTRIBUTOR_STATUS', 'Failed to fetch distributor application status', err);
      return res.status(500).json({ success: false, error: err.message });
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

      const app = await DistributorModel.updateStatus(id, status, notes);
      logger.event('DISTRIBUTOR', status === 'approved' ? '✅' : '❌', `Application ${id} ${status} by admin ${req.user.email}`);
      return res.json({ success: true, data: app });
    } catch (err) {
      logger.error('DISTRIBUTOR_STATUS_UPDATE', `Failed to update distributor application ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = DistributorController;
