/**
 * superAdminAuthController.js
 * ───────────────────────────
 * Handles SUPER_ADMIN authentication with:
 *   • Email + bcrypt password verification
 *   • Mandatory TOTP (authenticator app) second factor
 *   • Account lockout after 5 consecutive failures (15-min window)
 *   • Short-lived access JWT (15 min) + rotating httpOnly refresh token (7 days)
 *   • must_change_password gate
 *   • Full audit logging of every event
 *
 * Routes (mounted in superAdminRoutes.js at /api/super-admin/auth):
 *   POST /login            — step 1: email+password
 *   POST /totp             — step 2: TOTP code (uses temp_token from step 1)
 *   POST /refresh          — rotate refresh token
 *   POST /logout           — revoke refresh token
 *   POST /change-password  — forced password change
 */

const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User          = require('../models/schemas/User');
const AdminSession  = require('../models/schemas/AdminSession');
const { logger }    = require('../middleware/loggerMiddleware');
const { logAuditEvent } = require('../services/auditService');
const SecurityEventTypes = require('../utils/securityEventTypes');
const { ROLE_DEFAULT_PERMISSIONS } = require('../utils/permissions');
const { verifyTOTP } = require('../utils/totp');

const JWT_SECRET          = process.env.JWT_SECRET;
const ACCESS_TOKEN_TTL    = '15m';
const REFRESH_TOKEN_TTL   = 7 * 24 * 60 * 60; // seconds
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS          = 15 * 60 * 1000; // 15 minutes

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '0.0.0.0';
}
function clientUa(req) { return req.headers['user-agent'] || 'unknown'; }

/** Hash a raw refresh token with SHA-256 for storage */
function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Issue 15-min access JWT embedding role_name + permissions */
function issueAccessToken(user) {
  const perms = [
    ...(ROLE_DEFAULT_PERMISSIONS[user.role_name] || []),
    ...(user.extra_permissions || []),
  ];
  return jwt.sign(
    {
      id:                user._id.toString(),
      email:             user.email,
      role:              'admin',          // backward-compat with existing verifyAdmin()
      role_name:         user.role_name,  // new RBAC field
      extra_permissions: user.extra_permissions || [],
      allowlist:         user.ip_allowlist || [],
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL, algorithm: 'HS256' }
  );
}

/** Issue a cryptographically random refresh token and persist its hash */
async function issueRefreshToken(userId, req) {
  const raw = crypto.randomBytes(48).toString('hex');
  const hash = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

  await AdminSession.create({
    user_id:    userId,
    token_hash: hash,
    created_ip: clientIp(req),
    user_agent: clientUa(req),
    expires_at: expiresAt,
  });
  return raw;
}

/** Attach a refresh token as a httpOnly secure sameSite=strict cookie */
function setRefreshCookie(res, raw) {
  res.cookie('sa_refresh', raw, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'strict',
    maxAge:    REFRESH_TOKEN_TTL * 1000,
    path:      '/api/super-admin/auth',
  });
}

// ─── Step 1 — Email + Password ─────────────────────────────────────────────
exports.login = async (req, res) => {
  const ip = clientIp(req);
  const ua = clientUa(req);
  try {
    const email    = String(req.body?.email    || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    // Generic error prevents user enumeration
    const GENERIC_ERROR = 'Invalid credentials.';

    const user = await User.findOne({ email, role_name: 'SUPER_ADMIN' })
      .select('+password_hash +locked_until +failed_login_count +must_change_password +metadata')
      .lean();

    // ─── Lockout check ────────────────────────────────────────────────────
    if (user?.locked_until && new Date(user.locked_until) > new Date()) {
      const wait = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000);
      logger.security('SUPER_ADMIN_LOCKED', `Login blocked: account locked for ${wait}min`, { ip });
      await logAuditEvent({
        eventType: SecurityEventTypes.AUTH_LOGIN_FAILED,
        actorType: 'SUPER_ADMIN',
        req,
        userEmail: email,
        reason: 'account_locked',
        metadata: { locked_until: user.locked_until },
      });
      return res.status(429).json({ success: false, error: `Account locked. Try again in ${wait} minute(s).` });
    }

    // ─── Password check ───────────────────────────────────────────────────
    const passwordOk = user?.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!user || !passwordOk) {
      if (user) {
        const failCount = (user.failed_login_count || 0) + 1;
        const update = { $inc: { failed_login_count: 1 } };
        if (failCount >= MAX_FAILED_ATTEMPTS) {
          update.$set = { locked_until: new Date(Date.now() + LOCKOUT_MS) };
          logger.security('SUPER_ADMIN_LOCKOUT', `Account locked after ${failCount} failures`, { ip });
        }
        await User.updateOne({ _id: user._id }, update);
      }
      await logAuditEvent({
        eventType: SecurityEventTypes.AUTH_LOGIN_FAILED,
        actorType: 'SUPER_ADMIN',
        req,
        userEmail: email,
        reason: 'bad_credentials',
        metadata: { attempts: (user?.failed_login_count || 0) + 1 },
      });
      return res.status(401).json({ success: false, error: GENERIC_ERROR });
    }

    // ─── must_change_password gate ────────────────────────────────────────
    if (user.must_change_password) {
      // Issue a short-lived one-time token so the /change-password endpoint
      // can authenticate the request without granting a full session.
      const pwChangeToken = jwt.sign(
        { id: user._id.toString(), purpose: 'password_change' },
        JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.status(200).json({
        success: true,
        mustChangePassword: true,
        pwChangeToken,
        message: 'You must change your password before continuing.',
      });
    }

    // ─── TOTP required gate ───────────────────────────────────────────────
    if (!user.metadata?.twoFactor?.secret) {
      // TOTP not yet set up — return a totp_setup_token so /totp/setup can proceed
      logger.warn('SUPER_ADMIN_TOTP_MISSING', 'Super admin TOTP not configured', { ip });
      const setupToken = jwt.sign(
        { id: user._id.toString(), purpose: 'totp_setup' },
        JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.status(200).json({
        success: true,
        requiresTotpSetup: true,
        setupToken,
        message: 'TOTP is mandatory. Complete setup before continuing.',
      });
    }

    // Reset lockout counters
    await User.updateOne({ _id: user._id }, { $set: { failed_login_count: 0, locked_until: null } });

    // Issue a short-lived TOTP challenge token (not a session token)
    const totpToken = jwt.sign(
      { id: user._id.toString(), purpose: 'totp_challenge' },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    logger.info('SUPER_ADMIN_PW_OK', 'Password verified, TOTP required', { ip, email });
    return res.status(200).json({ success: true, requiresTotp: true, totpToken });

  } catch (err) {
    logger.error('SUPER_ADMIN_LOGIN', 'Login step 1 failed', err);
    return res.status(500).json({ success: false, error: 'Login failed.' });
  }
};

// ─── Step 2 — TOTP Verification ───────────────────────────────────────────
exports.verifyTotp = async (req, res) => {
  const ip = clientIp(req);
  try {
    const totpToken = String(req.body?.totpToken  || '');
    const code      = String(req.body?.code       || '').replace(/\s/g, '');

    // Validate the short-lived TOTP challenge token
    let payload;
    try {
      payload = jwt.verify(totpToken, JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      return res.status(401).json({ success: false, error: 'TOTP session expired. Please log in again.' });
    }
    if (payload.purpose !== 'totp_challenge') {
      return res.status(400).json({ success: false, error: 'Invalid token purpose.' });
    }

    const user = await User.findById(payload.id)
      .select('+metadata +ip_allowlist +extra_permissions')
      .lean();
    if (!user || user.role_name !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    // ─── IP allowlist check (optional, opt-in) ─────────────────────────
    const allowlist = user.ip_allowlist || [];
    if (allowlist.length > 0 && !allowlist.includes(ip)) {
      logger.security('SUPER_ADMIN_IP_BLOCKED', `IP ${ip} not in allowlist`, { ip });
      return res.status(403).json({ success: false, error: 'Access denied: IP not in allowlist.' });
    }

    const secret = user.metadata?.twoFactor?.secret;
    if (!secret) {
      return res.status(400).json({ success: false, error: 'TOTP not configured.' });
    }

    const totpOk = verifyTOTP(code, secret);
    if (!totpOk) {
      await logAuditEvent({
        eventType: SecurityEventTypes.MFA_FAILED,
        actorType: 'SUPER_ADMIN',
        req,
        userId: user._id.toString(),
        userEmail: user.email,
        reason: 'totp_invalid',
      });
      return res.status(401).json({ success: false, error: 'Invalid TOTP code.' });
    }

    // ─── Full session issued ───────────────────────────────────────────
    const accessToken  = issueAccessToken(user);
    const refreshRaw   = await issueRefreshToken(user._id, req);
    setRefreshCookie(res, refreshRaw);

    await logAuditEvent({
      eventType: SecurityEventTypes.ADMIN_ACCESS,
      actorType: 'SUPER_ADMIN',
      req,
      userId: user._id.toString(),
      userEmail: user.email,
      metadata: { action: 'SUPER_ADMIN_LOGIN_SUCCESS', method: 'password+totp' },
    });

    logger.success('SUPER_ADMIN_LOGIN_OK', `Super admin signed in: ${user.email}`, { ip });
    return res.json({
      success: true,
      accessToken,
      expiresIn: 15 * 60, // seconds
      user: { id: user._id, email: user.email, role_name: user.role_name },
    });

  } catch (err) {
    logger.error('SUPER_ADMIN_TOTP', 'TOTP step failed', err);
    return res.status(500).json({ success: false, error: 'TOTP verification failed.' });
  }
};

// ─── Refresh Token Rotation ────────────────────────────────────────────────
exports.refresh = async (req, res) => {
  const rawToken = req.cookies?.sa_refresh;
  if (!rawToken) {
    return res.status(401).json({ success: false, error: 'No refresh token.' });
  }
  try {
    const hash = hashToken(rawToken);
    const session = await AdminSession.findOne({ token_hash: hash, revoked: false });
    if (!session || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ success: false, error: 'Refresh token invalid or expired.' });
    }

    // Rotate: revoke old token, issue new one
    await AdminSession.updateOne({ _id: session._id }, { $set: { revoked: true } });

    const user = await User.findById(session.user_id)
      .select('+ip_allowlist +extra_permissions +metadata')
      .lean();
    if (!user || user.role_name !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const accessToken = issueAccessToken(user);
    const refreshRaw  = await issueRefreshToken(user._id, req);
    setRefreshCookie(res, refreshRaw);

    return res.json({ success: true, accessToken, expiresIn: 15 * 60 });
  } catch (err) {
    logger.error('SUPER_ADMIN_REFRESH', 'Token refresh failed', err);
    return res.status(500).json({ success: false, error: 'Refresh failed.' });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  const rawToken = req.cookies?.sa_refresh;
  if (rawToken) {
    const hash = hashToken(rawToken);
    await AdminSession.updateOne({ token_hash: hash }, { $set: { revoked: true } }).catch(() => {});
  }
  res.clearCookie('sa_refresh', { path: '/api/super-admin/auth' });
  await logAuditEvent({
    eventType: SecurityEventTypes.AUTH_LOGOUT,
    actorType: 'SUPER_ADMIN',
    req,
  });
  return res.json({ success: true });
};

// ─── Forced Password Change ────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const pwChangeToken = String(req.body?.pwChangeToken || '');
    const newPassword   = String(req.body?.newPassword   || '');

    let payload;
    try {
      payload = jwt.verify(pwChangeToken, JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    }
    if (payload.purpose !== 'password_change') {
      return res.status(400).json({ success: false, error: 'Invalid token purpose.' });
    }
    if (!newPassword || newPassword.length < 12) {
      return res.status(400).json({ success: false, error: 'Password must be at least 12 characters.' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await User.updateOne(
      { _id: payload.id },
      { $set: { password_hash: hash, must_change_password: false } }
    );

    await logAuditEvent({
      eventType: SecurityEventTypes.PASSWORD_CHANGED,
      actorType: 'SUPER_ADMIN',
      req,
      userId: payload.id,
      metadata: { forced: true },
    });

    return res.json({ success: true, message: 'Password changed. Please log in again with your new password.' });
  } catch (err) {
    logger.error('SUPER_ADMIN_CHANGE_PW', 'Change password failed', err);
    return res.status(500).json({ success: false, error: 'Password change failed.' });
  }
};
