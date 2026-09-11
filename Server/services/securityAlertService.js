const { sendEmail } = require('./emailService');
const { logger } = require('../middleware/loggerMiddleware');
const SecurityEventTypes = require('../utils/securityEventTypes');

// In-memory sliding windows for anomaly detection
const failedLoginAttemptsByIp = new Map();
const serverErrorTimestamps = [];

// Detection thresholds as recommended in task.md Section 9
const FAILED_LOGIN_THRESHOLD = 5;
const FAILED_LOGIN_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const SERVER_ERROR_THRESHOLD = 15;
const SERVER_ERROR_WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Periodic cleanup of stale tracking entries
setInterval(() => {
  const now = Date.now();

  for (const [ip, record] of failedLoginAttemptsByIp.entries()) {
    if (now - record.lastAttemptTime > FAILED_LOGIN_WINDOW_MS) {
      failedLoginAttemptsByIp.delete(ip);
    }
  }

  while (serverErrorTimestamps.length > 0 && now - serverErrorTimestamps[0] > SERVER_ERROR_WINDOW_MS) {
    serverErrorTimestamps.shift();
  }
}, CLEANUP_INTERVAL_MS).unref();

/**
 * Dispatches high-priority security notifications to administrators
 */
async function dispatchSecurityAlert({ alertType, message, ip, details = {}, severity = 'HIGH' }) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'worthitellp@gmail.com').trim().replace(/^["']|["']$/g, '');

  logger.error(SecurityEventTypes.SECURITY_ALERT, `[${severity}] ${alertType}: ${message}`, {
    alertType,
    ip,
    severity,
    details,
  });

  // Lazy-load auditService to prevent circular dependency
  try {
    const { logAuditEvent } = require('./auditService');
    await logAuditEvent({
      eventType: SecurityEventTypes.SECURITY_ALERT,
      actorType: 'SYSTEM',
      ipAddress: ip,
      reason: message,
      metadata: { alertType, severity, ...details },
    });
  } catch (err) {
    // Non-blocking catch
  }

  // Dispatch email notification to security administrator
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
      <h2 style="color: #ef4444; margin-top: 0;">🚨 RapiQR Security Alert [${severity}]</h2>
      <p><strong>Alert Type:</strong> ${alertType}</p>
      <p><strong>Description:</strong> ${message}</p>
      <p><strong>Source IP:</strong> ${ip || 'N/A'}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
      <pre style="background: #1e293b; padding: 12px; border-radius: 6px; overflow-x: auto; color: #94a3b8;">${JSON.stringify(details, null, 2)}</pre>
      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
        This is an automated threat detection alert from RapiQR CERT-In Security Engine.
      </p>
    </div>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `🚨 [SECURITY ALERT] ${alertType} detected on RapiQR`,
    html: emailHtml,
    text: `${alertType}: ${message} (Source IP: ${ip || 'N/A'})`,
    event: 'SECURITY_ALERT_EMAIL',
  });
}

/**
 * Tracks failed login attempts per IP and flags brute-force attacks
 */
async function trackFailedLogin({ ip, email, requestId }) {
  const now = Date.now();
  const clientIp = ip || 'UNKNOWN_IP';
  let record = failedLoginAttemptsByIp.get(clientIp);

  if (!record || now - record.lastAttemptTime > FAILED_LOGIN_WINDOW_MS) {
    record = { count: 1, firstAttemptTime: now, lastAttemptTime: now, emails: new Set([email]) };
    failedLoginAttemptsByIp.set(clientIp, record);
    return { count: 1, alertTriggered: false };
  }

  record.count += 1;
  record.lastAttemptTime = now;
  if (email) record.emails.add(email);

  let alertTriggered = false;
  if (record.count === FAILED_LOGIN_THRESHOLD) {
    alertTriggered = true;
    await dispatchSecurityAlert({
      alertType: SecurityEventTypes.AUTH_BRUTE_FORCE_ALERT,
      message: `Brute force warning: ${record.count} failed login attempts within 2 minutes from IP ${clientIp}`,
      ip: clientIp,
      details: {
        attempts: record.count,
        targetedAccounts: Array.from(record.emails),
        requestId,
      },
      severity: 'HIGH',
    });
  }

  return {
    count: record.count,
    alertTriggered,
    alertType: alertTriggered ? SecurityEventTypes.AUTH_BRUTE_FORCE_ALERT : undefined,
  };
}

/**
 * Resets failed login counters for an IP upon successful authentication
 */
function resetFailedLogins(ip) {
  if (ip && failedLoginAttemptsByIp.has(ip)) {
    failedLoginAttemptsByIp.delete(ip);
  }
}

/**
 * Tracks bursts in 500 server errors
 */
async function trackServerError({ statusCode, endpoint, ip, requestId }) {
  if (statusCode < 500) return { count: 0, alertTriggered: false };

  const now = Date.now();
  serverErrorTimestamps.push(now);

  // Keep only errors within sliding window
  while (serverErrorTimestamps.length > 0 && now - serverErrorTimestamps[0] > SERVER_ERROR_WINDOW_MS) {
    serverErrorTimestamps.shift();
  }

  let alertTriggered = false;
  if (serverErrorTimestamps.length === SERVER_ERROR_THRESHOLD) {
    alertTriggered = true;
    await dispatchSecurityAlert({
      alertType: 'SERVER_ERROR_SPIKE',
      message: `System alert: ${serverErrorTimestamps.length} internal server errors (5xx) detected within 60 seconds`,
      ip,
      details: {
        lastEndpoint: endpoint,
        recentErrorsCount: serverErrorTimestamps.length,
        requestId,
      },
      severity: 'CRITICAL',
    });
  }

  return {
    count: serverErrorTimestamps.length,
    alertTriggered,
    alertType: alertTriggered ? 'SERVER_ERROR_SPIKE' : undefined,
  };
}

module.exports = {
  dispatchSecurityAlert,
  trackFailedLogin,
  resetFailedLogins,
  trackServerError,
  FAILED_LOGIN_THRESHOLD,
  SERVER_ERROR_THRESHOLD,
};
