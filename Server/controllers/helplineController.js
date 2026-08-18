const HelplineModel = require('../models/helplineModel');
const { logger } = require('../middleware/loggerMiddleware');

class HelplineController {
  /**
   * Public: active helplines for the scan page (optionally filtered by category).
   */
  static async getPublic(req, res) {
    try {
      const { category } = req.query;
      const data = await HelplineModel.getActive(category);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('HELPLINE_LIST', 'Failed to fetch public helplines', err);
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
      const { category, label, phone, active } = req.body || {};
      if (!category || !label || !phone) {
        return res.status(400).json({ success: false, error: 'category, label and phone are required' });
      }
      const data = await HelplineModel.create({ category, label, phone, active });
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
