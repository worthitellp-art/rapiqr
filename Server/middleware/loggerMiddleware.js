/**
 * Live Console Logger Middleware for NamoQR Server
 * Provides formatted, real-time logging of HTTP requests, status codes, response times, and server events.
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
 * Express middleware to log incoming HTTP requests and response performance live in console
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const timestamp = formatTimestamp();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const origin = req.headers.origin || 'NO-ORIGIN';

  // Log incoming request
  console.log(`\n[${timestamp}] 📥 INCOMING ${req.method} ${req.originalUrl || req.url} - IP: ${clientIp}`);
  console.log(`   🌐 Origin: ${origin}`);
  
  if (Object.keys(req.query || {}).length > 0) {
    console.log(`   🔎 Query: ${JSON.stringify(req.query)}`);
  }
  
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***REDACTED***';
    if (sanitizedBody.credential) sanitizedBody.credential = '***REDACTED***';
    if (sanitizedBody.idToken) sanitizedBody.idToken = '***REDACTED***';
    console.log(`   📦 Body Payload: ${JSON.stringify(sanitizedBody)}`);
  }

  // Hook into response finish event to calculate duration and log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const badge = getStatusBadge(res.statusCode);
    console.log(`[${formatTimestamp()}] ${badge} ${req.method} ${req.originalUrl || req.url} finished in ${duration}ms`);
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
