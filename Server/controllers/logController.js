const LogModel = require('../models/logModel');
const { logger } = require('../middleware/loggerMiddleware');
const { queryAuditLogs, logAuditEvent } = require('../services/auditService');
const SecurityEventTypes = require('../utils/securityEventTypes');

class LogController {
  /**
   * Get Live Operational Server Logs
   */
  static async getLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 100;
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
        data: logs || [],
      });
    } catch (err) {
      logger.error('LOGS_API', 'Failed to retrieve server operational logs', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get Immutable Audit Logs (CERT-In Compliance)
   */
  static async getAuditLogs(req, res) {
    try {
      const {
        limit = 50,
        page = 1,
        eventType,
        actorType,
        userId,
        requestId,
        ipAddress,
        resourceType,
        startDate,
        endDate,
      } = req.query;

      const result = await queryAuditLogs({
        limit: parseInt(limit, 10) || 50,
        page: parseInt(page, 10) || 1,
        eventType,
        actorType,
        userId,
        requestId,
        ipAddress,
        resourceType,
        startDate,
        endDate,
      });

      return res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      logger.error('AUDIT_LOGS_API', 'Failed to retrieve audit logs', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Disallow deletion of compliance audit logs
   */
  static async rejectAuditLogDeletion(req, res) {
    await logAuditEvent({
      eventType: SecurityEventTypes.SECURITY_ALERT,
      actorType: 'ADMIN',
      req,
      reason: 'Unauthorized attempt to delete compliance audit logs',
      statusCode: 403,
      metadata: { action: 'REJECTED_AUDIT_LOG_PURGE' },
    });

    return res.status(403).json({
      success: false,
      error: 'CERT-In Compliance Protection: AuditLog records are append-only and cannot be cleared or deleted.',
    });
  }

  /**
   * Clear Ephemeral Operational Logs (Audit Logs remain untouched)
   */
  static async clearLogs(req, res) {
    try {
      await LogModel.clearLogs();
      logger.event('LOGS_API', '🧹', 'Operational server logs cleared from database');

      // Record administrative action in immutable audit log
      await logAuditEvent({
        eventType: SecurityEventTypes.DATA_DELETED,
        actorType: 'ADMIN',
        req,
        resourceType: 'OPERATIONAL_LOGS',
        reason: 'Admin cleared ephemeral operational server logs',
        statusCode: 200,
      });

      return res.json({
        success: true,
        message: 'Operational server logs cleared successfully. Audit trail preserved.',
      });
    } catch (err) {
      logger.error('LOGS_API', 'Failed to clear operational server logs', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = LogController;
