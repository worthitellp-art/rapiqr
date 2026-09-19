const AuditLog = require('../models/schemas/AuditLog');
const { sanitize, getRequestId, getUserId, logger } = require('../middleware/loggerMiddleware');
const SecurityEventTypes = require('../utils/securityEventTypes');
const { trackFailedLogin, resetFailedLogins, trackServerError } = require('./securityAlertService');

/**
 * Extract clean client IP handling proxy headers
 */
function extractClientIp(req) {
  if (!req) return null;
  const forwarded = req.headers ? req.headers['x-forwarded-for'] : null;
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

/**
 * Record an immutable audit event in compliance with CERT-In and DPDP requirements.
 */
async function logAuditEvent({
  eventType,
  actorType = 'ANONYMOUS',
  req = null,
  userId = null,
  userEmail = null,
  ipAddress = null,
  userAgent = null,
  method = null,
  endpoint = null,
  resourceType = null,
  resourceId = null,
  statusCode = null,
  reason = null,
  metadata = {},
}) {
  const resolvedRequestId = (req && req.requestId) || getRequestId() || null;
  const resolvedUserId = userId || (req && req.user && req.user.id) || getUserId() || null;
  const resolvedUserEmail = userEmail || (req && req.user && req.user.email) || null;
  const resolvedIp = ipAddress || extractClientIp(req);
  const resolvedUserAgent = userAgent || (req && req.headers ? req.headers['user-agent'] : null);
  const resolvedMethod = method || (req ? req.method : null);
  const resolvedEndpoint = endpoint || (req ? req.originalUrl || req.url : null);
  const resolvedStatusCode = statusCode || (req && req.res ? req.res.statusCode : null);

  // Sanitized payload ensures no passwords, tokens, OTPs or raw card numbers are recorded
  const cleanMetadata = sanitize(metadata || {});

  try {
    const auditRecord = await AuditLog.create({
      event_type: eventType,
      actor_type: actorType,
      user_id: resolvedUserId,
      user_email: resolvedUserEmail,
      request_id: resolvedRequestId,
      ip_address: resolvedIp,
      user_agent: resolvedUserAgent,
      method: resolvedMethod,
      endpoint: resolvedEndpoint,
      resource_type: resourceType,
      resource_id: resourceId,
      status_code: resolvedStatusCode,
      reason,
      metadata: cleanMetadata,
      created_at: new Date(),
    });

    // Trigger security anomaly tracking
    if (eventType === SecurityEventTypes.AUTH_LOGIN_FAILED) {
      await trackFailedLogin({ ip: resolvedIp, email: resolvedUserEmail, requestId: resolvedRequestId });
    } else if (eventType === SecurityEventTypes.AUTH_LOGIN_SUCCESS) {
      resetFailedLogins(resolvedIp);
    }

    if (resolvedStatusCode && resolvedStatusCode >= 500) {
      await trackServerError({
        statusCode: resolvedStatusCode,
        endpoint: resolvedEndpoint,
        ip: resolvedIp,
        requestId: resolvedRequestId,
      });
    }

    return auditRecord;
  } catch (err) {
    // Audit logging must be non-blocking to protect application request flow
    console.error(`[AUDIT_LOG_FAILURE] Failed to write audit event ${eventType}:`, err.message);
    logger.fatal('AUDIT_LOG_FAILURE', `Failed to write compliance audit event ${eventType}`, err);
    return null;
  }
}

/**
 * Query audit logs with pagination and multi-field filters
 */
async function queryAuditLogs({
  limit = 50,
  page = 1,
  eventType = null,
  actorType = null,
  userId = null,
  requestId = null,
  ipAddress = null,
  resourceType = null,
  startDate = null,
  endDate = null,
} = {}) {
  const query = {};

  if (eventType && eventType !== 'ALL') {
    query.event_type = String(eventType).trim();
  }

  if (actorType && actorType !== 'ALL') {
    query.actor_type = String(actorType).trim().toUpperCase();
  }

  if (userId) {
    query.user_id = String(userId).trim();
  }

  if (requestId) {
    query.request_id = String(requestId).trim();
  }

  if (ipAddress) {
    query.ip_address = String(ipAddress).trim();
  }

  if (resourceType) {
    query.resource_type = String(resourceType).trim();
  }

  if (startDate || endDate) {
    query.created_at = {};
    if (startDate) query.created_at.$gte = new Date(startDate);
    if (endDate) query.created_at.$lte = new Date(endDate);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [records, totalCount] = await Promise.all([
    AuditLog.find(query).sort({ created_at: -1 }).skip(skip).limit(safeLimit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    data: records.map((r) => ({ ...r, id: String(r._id) })),
    pagination: {
      total: totalCount,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(totalCount / safeLimit),
    },
  };
}

module.exports = {
  logAuditEvent,
  queryAuditLogs,
  extractClientIp,
};
