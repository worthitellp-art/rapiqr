/**
 * Live Console Logger Middleware for NamoQR Server
 * Provides clean, one-line-per-request logging plus operation-level event helpers.
 */

function formatTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

function getStatusBadge(status) {
  if (status >= 500) return `🔴 ${status}`;
  if (status >= 400) return `🟡 ${status}`;
  if (status >= 300) return `🔵 ${status}`;
  if (status >= 200) return `🟢 ${status}`;
  return `⚪ ${status}`;
}

/**
 * Express middleware: ONE concise log line per finished request.
 * No body/query dumps — those create log spam. Operation context is logged
 * by the controllers via the logger helper instead.
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const origin = req.headers.origin || '-';

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const badge = getStatusBadge(res.statusCode);
    console.log(`[${formatTimestamp()}] ${badge} ${req.method} ${req.originalUrl || req.url} · ${duration}ms · ${origin}`);
  });

  next();
}

/**
 * Event Logger Helper for application actions
 */
const logger = {
  info: (tag, message, meta = '') => {
    console.log(`[${formatTimestamp()}] ℹ️  [${tag}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  success: (tag, message, meta = '') => {
    console.log(`[${formatTimestamp()}] ✅ [${tag}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (tag, message, meta = '') => {
    console.warn(`[${formatTimestamp()}] ⚠️  [${tag}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (tag, message, err = '') => {
    console.error(`[${formatTimestamp()}] 💥 [${tag}] ${message}`, err ? (err.stack || err) : '');
  },
  event: (tag, emoji, message) => {
    console.log(`[${formatTimestamp()}] ${emoji} [${tag}] ${message}`);
  }
};

module.exports = {
  requestLogger,
  logger
};
