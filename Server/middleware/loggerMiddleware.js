/**
 * NamoQR Production Server Logger
 * ----------------------------------------------------------------------------
 * Implements the professional logging standard:
 *   - Structured JSON logs (timestamp, level, service, event, requestId,
 *     userId, resourceId, duration, status, message, metadata)
 *   - 8 core categories: HTTP, AUTH, USER, BUSINESS, DB, EXTERNAL, SECURITY, ERROR
 *   - Request lifecycle tracking (REQUEST_START → … → REQUEST_END)
 *   - Auto requestId correlation via AsyncLocalStorage
 *   - Strict data sanitization (passwords, OTPs, tokens, cards are never logged)
 *
 * Every entry is persisted to the Supabase `server_logs` table and to an
 * in-memory live buffer that powers the admin Live Logs feed.
 */

const crypto = require('crypto');
const { AsyncLocalStorage } = require('async_hooks');
const { supabaseAdmin } = require('../config/db');

/* ── Constants ──────────────────────────────────────────────────────────── */

const SERVICE_NAME = 'repiqr-server';
const MAX_BUFFER_SIZE = 200;

const LEVELS = ['DEBUG', 'INFO', 'SUCCESS', 'HTTP', 'EVENT', 'WARN', 'ERROR', 'FATAL'];

// Core categories (task.md 8 categories)
const CATEGORIES = ['HTTP', 'AUTH', 'USER', 'BUSINESS', 'DB', 'EXTERNAL', 'SECURITY', 'ERROR', 'SYSTEM'];

/* ── AsyncLocalStorage request correlation ──────────────────────────────── */

const requestStore = new AsyncLocalStorage();

function currentContext() {
  return requestStore.getStore() || null;
}

function getRequestId() {
  const ctx = currentContext();
  return ctx ? ctx.requestId : null;
}

function getUserId() {
  const ctx = currentContext();
  return ctx ? ctx.userId : null;
}

/**
 * Set the authenticated user id for the remainder of the current request.
 * Safe to call from auth middleware/controllers once identity is resolved.
 */
function setUserId(userId) {
  const ctx = currentContext();
  if (ctx && userId) ctx.userId = userId;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatTimestamp() {
  return new Date().toISOString();
}

function generateUUID() {
  try {
    return crypto.randomUUID();
  } catch {
    return '00000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padStart(12, '0');
  }
}

function generateRequestId() {
  return 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

function getStatusBadge(status) {
  if (status >= 500) return `🔴 ${status}`;
  if (status >= 400) return `🟡 ${status}`;
  if (status >= 300) return `🔵 ${status}`;
  if (status >= 200) return `🟢 ${status}`;
  return `⚪ ${status}`;
}

/* ── Data sanitizer (security rule: never log sensitive data) ──────────── */

const SENSITIVE_KEY = /pass|pwd|secret|token|auth|apikey|api_key|cvv|card|pan|pin|otp|jwt|bearer|credential/i;

function maskPhone(v) {
  const digits = String(v).replace(/\D/g, '');
  if (digits.length < 10) return v;
  return '******' + digits.slice(-4);
}

function maskEmail(v) {
  const s = String(v);
  const at = s.indexOf('@');
  if (at <= 0) return s;
  return s.charAt(0) + '***' + s.substring(at);
}

function sanitizeValue(value, key) {
  const k = String(key || '').toLowerCase();
  // Redact sensitive values by key name
  if (SENSITIVE_KEY.test(k)) {
    if (typeof value === 'string' && value.length > 0) return '[REDACTED]';
    return value;
  }
  if (typeof value === 'string') {
    // Mask phone numbers stored under phone-ish keys
    if (/phone|mobile|contact|telephone|tel\b|number/i.test(k) && /\d{6,}/.test(value)) {
      return maskPhone(value);
    }
    if (/email/i.test(k) && value.includes('@')) {
      return maskEmail(value);
    }
    // Mask long digit runs (raw phone numbers passed in generic payloads)
    if (/\d{10,}/.test(value)) {
      const raw = value.replace(/\D/g, '');
      if (raw.length >= 10) return maskPhone(value);
    }
  }
  return value;
}

/**
 * Deep-walk an object/array and scrub sensitive fields, phones & emails.
 */
function sanitize(input, seen = new WeakSet()) {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') {
    // Generic mask for raw phone-like strings that are 10+ digits
    if (/\d{10,}/.test(input)) {
      const raw = input.replace(/\D/g, '');
      if (raw.length >= 10) return maskPhone(input);
    }
    if (input.includes('@') && /^\S+@\S+\.\S+$/.test(input)) return maskEmail(input);
    return input;
  }
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  if (typeof input !== 'object') return input;
  if (seen.has(input)) return undefined;
  seen.add(input);

  if (Array.isArray(input)) {
    return input.map(i => sanitize(i, seen));
  }

  const out = {};
  for (const key of Object.keys(input)) {
    out[key] = sanitizeValue(sanitize(input[key], seen), key);
  }
  return out;
}

/* ── In-memory live buffer ──────────────────────────────────────────────── */

global.__REPIQR_LIVE_LOGS__ = global.__REPIQR_LIVE_LOGS__ || global.__NAMOQR_LIVE_LOGS__ || [];

function pushToMemoryBuffer(logItem) {
  global.__REPIQR_LIVE_LOGS__.unshift(logItem);
  if (global.__REPIQR_LIVE_LOGS__.length > MAX_BUFFER_SIZE) {
    global.__REPIQR_LIVE_LOGS__.pop();
  }
}

function getMemoryLogs({ limit = 100, level = null, tag = null, category = null, event = null, userId = null, requestId = null } = {}) {
  let result = [...(global.__REPIQR_LIVE_LOGS__ || [])];
  if (level && level !== 'ALL') {
    result = result.filter(l => String(l.level || '').toUpperCase() === String(level).toUpperCase());
  }
  if (tag) {
    const q = tag.toLowerCase();
    result = result.filter(l => (l.tag || '').toLowerCase().includes(q));
  }
  if (category && category !== 'ALL') {
    result = result.filter(l => String(l.category || '').toUpperCase() === String(category).toUpperCase());
  }
  if (event) {
    result = result.filter(l => (l.event || '') === event);
  }
  if (userId) {
    result = result.filter(l => (l.user_id || '') === userId);
  }
  if (requestId) {
    result = result.filter(l => (l.request_id || '') === requestId);
  }
  return result.slice(0, limit);
}

function clearMemoryLogs() {
  if (global.__REPIQR_LIVE_LOGS__) global.__REPIQR_LIVE_LOGS__.length = 0;
}

/* ── Persistence ────────────────────────────────────────────────────────── */

let tableExists = true;

/**
 * Build the canonical structured log item and persist it.
 * @param {object} payload {
 *   level, category, tag, event, message, details/metadata,
 *   requestId, userId, resourceId, method, url, statusCode, durationMs, origin, ip
 * }
 */
async function writeLogToSupabase(payload) {
  const uuid = generateUUID();
  const ctx = currentContext();
  const details = sanitize(payload.details || payload.metadata || {});

  const logItem = {
    id: uuid,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    level: LEVELS.includes(payload.level) ? payload.level : 'INFO',
    category: (payload.category || inferCategory(payload.tag || payload.event || '')).toUpperCase(),
    service: payload.service || SERVICE_NAME,
    tag: payload.tag || payload.event || 'SERVER',
    event: payload.event || payload.tag || 'GENERIC',
    message: payload.message || '',
    details: typeof details === 'object' ? details : { raw: details },
    method: payload.method || null,
    url: payload.url || null,
    status_code: payload.statusCode || payload.status_code || null,
    duration_ms: payload.durationMs || payload.duration_ms || null,
    origin: payload.origin || null,
    ip: payload.ip || null,
    request_id: payload.requestId || (ctx && ctx.requestId) || null,
    user_id: payload.userId || (ctx && ctx.userId) || null,
    resource_id: payload.resourceId || null,
    status: payload.status || null,
    metadata: sanitize(payload.metadata || {})
  };

  pushToMemoryBuffer(logItem);

  if (!supabaseAdmin) return;
  try {
    const { error } = await supabaseAdmin.from('server_logs').insert([{
      id: uuid,
      timestamp: logItem.timestamp,
      level: logItem.level,
      category: logItem.category,
      service: logItem.service,
      tag: logItem.tag,
      event: logItem.event,
      message: logItem.message,
      details: logItem.details,
      method: logItem.method,
      url: logItem.url,
      status_code: logItem.status_code,
      duration_ms: logItem.duration_ms,
      origin: logItem.origin,
      ip: logItem.ip,
      request_id: logItem.request_id,
      user_id: logItem.user_id,
      resource_id: logItem.resource_id,
      status: logItem.status,
      metadata: logItem.metadata
    }]);

    if (error && error.code === '42P01') {
      if (tableExists) {
        tableExists = false;
        console.warn(`[${formatTimestamp()}] ⚠️  [SUPABASE_LOGS] Note: 'server_logs' table not created in Supabase yet. Live logs running in-memory.`);
      }
    }
  } catch (err) {
    // Non-blocking catch — logging must never break the request
  }
}

function inferCategory(tag) {
  const t = String(tag || '').toUpperCase();
  if (t.startsWith('AUTH') || t.includes('LOGIN') || t.includes('SIGNUP') || t.includes('OTP') || t.includes('GOOGLE')) return 'AUTH';
  if (t.startsWith('HTTP') || t.includes('ROUTE')) return 'HTTP';
  if (t.includes('DATABASE') || t.startsWith('DB') || t.includes('_DB_')) return 'DB';
  if (t.includes('SECURITY') || t.includes('BLOCK') || t.includes('SUSPICIOUS')) return 'SECURITY';
  if (t.includes('PAYMENT') || t.includes('ORDER') || t.includes('CHECKOUT')) return 'BUSINESS';
  if (t.includes('EXTERNAL') || t.includes('TWILIO') || t.includes('RAZORPAY') || t.includes('GOOGLE') || t.includes('SMS')) return 'EXTERNAL';
  if (t.includes('ERROR') || t.includes('FAIL')) return 'ERROR';
  if (t.includes('USER') || t.includes('PROFILE')) return 'USER';
  if (t.includes('SERVER')) return 'SYSTEM';
  return 'BUSINESS';
}

/* ── Logging core ───────────────────────────────────────────────────────── */

function emit(payload) {
  const meta = {
    level: payload.level || 'INFO',
    tag: payload.tag || payload.event || 'SERVER',
    message: payload.message || '',
    details: payload.details || payload.metadata || null
  };
  const emoji = payload.emoji || '';
  const line = emoji
    ? `[${formatTimestamp()}] ${emoji} [${meta.tag}] ${meta.message}`
    : `[${formatTimestamp()}] ${meta.level} [${meta.tag}] ${meta.message}`;

  if (meta.level === 'ERROR' || meta.level === 'FATAL') {
    console.error(line, meta.details ? JSON.stringify(sanitize(meta.details)) : '');
  } else if (meta.level === 'WARN') {
    console.warn(line, meta.details ? JSON.stringify(sanitize(meta.details)) : '');
  } else {
    console.log(line, meta.details ? JSON.stringify(sanitize(meta.details)) : '');
  }

  writeLogToSupabase(payload);
}

/* ── Public logger API ──────────────────────────────────────────────────── */

const logger = {
  /* Request lifecycle */
  requestStart(req) {
    const url = req.originalUrl || req.url;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    emit({
      level: 'INFO',
      category: 'HTTP',
      event: 'REQUEST_START',
      tag: 'HTTP',
      message: `${req.method} ${url}`,
      method: req.method,
      url,
      ip,
      origin: req.headers.origin || req.headers.referer || 'Direct API'
    });
  },

  requestPhase(phase, message, extra = {}) {
    emit({
      level: 'INFO',
      category: 'HTTP',
      event: phase,
      tag: 'HTTP',
      message,
      ...extra
    });
  },

  requestEnd(req, res, startTime) {
    const durationMs = Date.now() - startTime;
    const url = req.originalUrl || req.url;
    const badge = getStatusBadge(res.statusCode);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    console.log(`[${formatTimestamp()}] ${badge} [HTTP ${req.method}] ${url} (${res.statusCode}) finished in ${durationMs}ms`);
    emit({
      level: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'HTTP',
      category: 'HTTP',
      event: 'REQUEST_END',
      tag: `HTTP_${req.method}`,
      message: `${req.method} request to ${url} responded with status ${res.statusCode}`,
      method: req.method,
      url,
      statusCode: res.statusCode,
      durationMs,
      origin: req.headers.origin || req.headers.referer || 'Direct API',
      ip
    });
  },

  /* Level helpers — signature: (event, message, details?, opts?) */
  debug: (event, message, details = null, opts = {}) => emit({ level: 'DEBUG', event, tag: opts.tag || event, message, details, ...opts }),
  info: (event, message, details = null, opts = {}) => emit({ level: 'INFO', event, tag: opts.tag || event, message, details, ...opts }),
  success: (event, message, details = null, opts = {}) => emit({ level: 'SUCCESS', event, tag: opts.tag || event, message, details, ...opts }),
  warn: (event, message, details = null, opts = {}) => emit({ level: 'WARN', event, tag: opts.tag || event, message, details, ...opts }),
  error: (event, message, err = null, opts = {}) => {
    const errDetails = err ? (err.stack ? { message: err.message, stack: err.stack } : err) : null;
    emit({ level: 'ERROR', event, tag: opts.tag || event, message, details: errDetails, ...opts });
  },
  fatal: (event, message, err = null, opts = {}) => {
    const errDetails = err ? (err.stack ? { message: err.message, stack: err.stack } : err) : null;
    emit({ level: 'FATAL', event, tag: opts.tag || event, message, details: errDetails, ...opts });
  },

  /* Category helpers — map into the 8 core categories */
  http: (event, message, details = null, opts = {}) => emit({ level: 'HTTP', category: 'HTTP', event, tag: opts.tag || event, message, details, ...opts }),
  auth: (event, message, details = null, opts = {}) => emit({ level: 'INFO', category: 'AUTH', event, tag: opts.tag || event, message, details, ...opts }),
  user: (event, message, details = null, opts = {}) => emit({ level: 'INFO', category: 'USER', event, tag: opts.tag || event, message, details, ...opts }),
  business: (event, message, details = null, opts = {}) => emit({ level: 'INFO', category: 'BUSINESS', event, tag: opts.tag || event, message, details, ...opts }),
  db: (event, message, details = null, opts = {}) => emit({ level: 'INFO', category: 'DB', event, tag: opts.tag || event, message, details, ...opts }),
  external: (event, message, details = null, opts = {}) => emit({ level: 'INFO', category: 'EXTERNAL', event, tag: opts.tag || event, message, details, ...opts }),
  security: (event, message, details = null, opts = {}) => emit({ level: 'WARN', category: 'SECURITY', event, tag: opts.tag || event, message, details, ...opts }),
  audit: (event, message, details = null, opts = {}) => emit({ level: 'INFO', category: 'AUTH', event, tag: opts.tag || event, message, details, ...opts }),
  performance: (event, message, details = null, opts = {}) => emit({ level: 'INFO', category: 'SYSTEM', event, tag: opts.tag || event, message, details, ...opts }),

  /* Backwards-compatible helpers */
  event: (tag, emoji, message, details = null, opts = {}) => emit({ level: 'EVENT', tag, event: tag, message, details, emoji, ...opts }),

  rowInserted: (tableName, rowId, details = null) => {
    const msg = `New row inserted into table '${tableName}': ${rowId}`;
    emit({ level: 'SUCCESS', category: 'DB', event: 'DATABASE_INSERT', tag: 'DATABASE_INSERT', message: msg, details, resourceId: rowId });
  },
  rowUpdated: (tableName, rowId, details = null) => {
    const msg = `Row updated in table '${tableName}': ${rowId}`;
    emit({ level: 'SUCCESS', category: 'DB', event: 'DATABASE_UPDATE', tag: 'DATABASE_UPDATE', message: msg, details, resourceId: rowId });
  },
  rowDeleted: (tableName, rowId, details = null) => {
    const msg = `Row removed from table '${tableName}': ${rowId}`;
    emit({ level: 'WARN', category: 'DB', event: 'DATABASE_DELETE', tag: 'DATABASE_DELETE', message: msg, details, resourceId: rowId });
  }
};

/* ── Express request middleware ─────────────────────────────────────────── */

/**
 * HTTP request lifecycle logger. Skips internal noise endpoints.
 * Uses AsyncLocalStorage so every log emitted during the request is
 * automatically correlated with a unique requestId.
 */
function requestLogger(req, res, next) {
  const url = req.originalUrl || req.url;

  // Filter out internal background polling
  if (url.includes('/api/health') || url.includes('/api/logs')) {
    return next();
  }

  const startTime = Date.now();
  const requestId = generateRequestId();
  req.requestId = requestId;

  const store = { requestId, userId: null };
  requestStore.run(store, () => {
    logger.requestStart(req);

    res.on('finish', () => {
      logger.requestEnd(req, res, startTime);
    });

    next();
  });
}

module.exports = {
  requestLogger,
  logger,
  writeLogToSupabase,
  getMemoryLogs,
  clearMemoryLogs,
  sanitize,
  generateRequestId,
  getRequestId,
  setUserId,
  CATEGORIES,
  LEVELS
};
