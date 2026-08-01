const LogModel = require('../models/logModel');
const { logger } = require('../middleware/loggerMiddleware');

class LogController {
  /**
   * Get Live Server Logs from Supabase
   */
  static async getLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const level = req.query.level || null;
      const tag = req.query.tag || null;
      const category = req.query.category || null;
      const event = req.query.event || null;
      const userId = req.query.userId || null;
      const requestId = req.query.requestId || null;

      const logs = await LogModel.getLogs({ limit, level, tag, category, event, userId, requestId });
      return res.json({
        success: true,
        count: logs ? logs.length : 0,
        data: logs || []
      });
    } catch (err) {
      logger.error('LOGS_API', 'Failed to retrieve server logs', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Clear Server Logs
   */
  static async clearLogs(req, res) {
    try {
      const cleared = await LogModel.clearLogs();
      logger.event('LOGS_API', '🧹', 'Server operational logs cleared from database');
      return res.json({ success: true, message: 'Server logs cleared successfully' });
    } catch (err) {
      logger.error('LOGS_API', 'Failed to clear server logs', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = LogController;
