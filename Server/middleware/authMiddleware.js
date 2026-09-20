const jwt = require('jsonwebtoken');
const { setUserId } = require('./loggerMiddleware');
const { normalizePhone } = require('../utils/phone');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in Server/.env — refusing to start with an insecure default secret.');
}
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'worthitellp@gmail.com').trim().replace(/^["']|["']$/g, '');
// The single phone number allowed to sign into the /admin route (via OTP —
// see AuthController.sendAdminPhoneOtp/verifyAdminPhoneOtp). Overridable via
// Server/.env for other deployments; the fallback is this deployment's number.
const ADMIN_PHONE = normalizePhone(process.env.ADMIN_PHONE) || normalizePhone('9313719720');

/**
 * Verify our own JWT. There is no external auth provider anymore — the
 * profile document in MongoDB IS the account, so a valid JWT is the only
 * form of session there is.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    // Correlates every log emitted for the rest of this request (including the
    // HTTP REQUEST_START/END entries already logged for every route) with the
    // acting user, so the "what did this user do" audit trail is automatic
    // rather than requiring every controller to pass userId explicitly.
    setUserId(req.user.id);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session' });
  }
}

/**
 * Identifies the caller if a valid token is present, but never blocks the
 * request — for endpoints that must stay usable by guests (e.g. checkout)
 * while still linking the record to an account when the caller happens to
 * be logged in.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    setUserId(req.user.id);
  } catch { /* invalid/expired token — proceed as guest */ }
  next();
}

/**
 * Require admin privileges
 */
function verifyAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
  }

  const isAdmin = req.user.role === 'admin' || req.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (!isAdmin) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin privileges required' });
  }

  next();
}

module.exports = {
  verifyToken,
  optionalAuth,
  verifyAdmin,
  JWT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PHONE
};
