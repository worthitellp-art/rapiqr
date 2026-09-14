const HelplineModel = require('../models/helplineModel');
const { logger } = require('../middleware/loggerMiddleware');

class HelplineController {
  /**
   * Public: active providers for the scan page.
   *
   * Query params (all optional, all backwards compatible):
   *   category        legacy label filter ("Towing") — used by the car/bike screen
   *   serviceType     slug filter ("towing", "veterinarian") — used by SERVICE_PROVIDER buttons
   *   stickerCategory keeps only providers scoped to that sticker category ("pet"),
   *                   plus every provider scoped to no category at all
   *   city            keeps only providers scoped to that city, plus every
   *                   provider with no city set — pass the visitor's
   *                   (reverse-geocoded) city to prefer local numbers
   *
   * With no params this returns the full active list, which is what the scan page
   * preloads once on mount and then resolves against client-side.
   */
  static async getPublic(req, res) {
    try {
      const { category, serviceType, stickerCategory, city } = req.query;
      const data = await HelplineModel.getActive({ category, serviceType, stickerCategory, city });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('HELPLINE_LIST', 'Failed to fetch public helplines', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Public: a service provider applying through the landing page "Join us" form.
   *
   * The row lands in the same `communication` directory the admin manages, but
   * INACTIVE — `getActive` filters on `active = true`, so an application is
   * never dialled by a scan page until the admin approves it in
   * Admin -> Communication by flipping it to Active.
   */
  static async apply(req, res) {
    try {
      const { category, serviceType, categories, label, phone, email, city, country, notes } = req.body || {};
      if (!category || !label || !phone) {
        return res.status(400).json({ success: false, error: 'category, label and phone are required' });
      }
      const data = await HelplineModel.create({
        category,
        serviceType,
        categories,
        label,
        phone,
        email,
        city,
        country,
        notes,
        active: false, // pending admin approval
      });
      logger.rowInserted('communication', data.id, { category, label, source: 'public_application' });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('HELPLINE_APPLY', 'Failed to submit provider application', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Admin: full management list, including inactive helplines.
   */
  static async getAll(req, res) {
    try {
      const data = await HelplineModel.getAll();
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('HELPLINE_LIST', 'Failed to fetch helplines', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const { category, serviceType, categories, label, phone, active, email, city, country, notes } = req.body || {};
      if (!category || !label || !phone) {
        return res.status(400).json({ success: false, error: 'category, label and phone are required' });
      }
      const data = await HelplineModel.create({ category, serviceType, categories, label, phone, active, email, city, country, notes });
      logger.rowInserted('communication', data.id, { category, label });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('HELPLINE_CREATE', 'Failed to create helpline', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = await HelplineModel.update(id, req.body || {});
      logger.rowUpdated('communication', id, { action: 'updated' });
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('HELPLINE_UPDATE', `Failed to update helpline: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async remove(req, res) {
    try {
      const { id } = req.params;
      await HelplineModel.remove(id);
      logger.rowDeleted('communication', id);
      return res.json({ success: true });
    } catch (err) {
      logger.error('HELPLINE_DELETE', `Failed to delete helpline: ${req.params.id}`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = HelplineController;
