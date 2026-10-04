const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { JWT_SECRET, ADMIN_EMAIL } = require('../middleware/authMiddleware');
const { logger } = require('../middleware/loggerMiddleware');
const { verifyPassword } = require('../utils/passwords');
const loginAttemptTracker = require('../utils/loginAttemptTracker');
const SecurityEventTypes = require('../utils/securityEventTypes');
const { logAuditEvent } = require('../services/auditService');

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
}
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Admin Fleet Panel sign-in: email + password. Only ADMIN_EMAIL can sign in, and
 * the password is checked against a bcrypt hash in Server/.env (ADMIN_PASSWORD_HASH),
 * so no plain-text password exists anywhere in the code or the database.
 * POST /api/auth/admin-login   Body: { email, password }
 */
exports.adminLogin = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!passwordHash) {
      return res.status(503).json({ success: false, error: 'Admin sign-in is not configured on the server.' });
    }
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const attemptKey = `admin-login:${ip}`;
    const credentialsOk =
      email === ADMIN_EMAIL.toLowerCase() && (await verifyPassword(password, passwordHash));

    if (!credentialsOk) {
      const failCount = loginAttemptTracker.recordFailure(attemptKey);
      logger.security('ADMIN_LOGIN_FAILED', 'Admin sign-in rejected', { ip, userAgent, failCount });
      await logAuditEvent({
        eventType: SecurityEventTypes.AUTH_LOGIN_FAILED,
        actorType: 'ANONYMOUS',
        req,
        statusCode: 401,
        reason: 'Admin credentials rejected',
        metadata: { target: 'admin', failCount },
      });
      // Same message for a wrong email and a wrong password — never say which.
      return res.status(401).json({ success: false, error: 'Incorrect email or password.' });
    }

    loginAttemptTracker.clear(attemptKey);

    let profile = await UserModel.findByEmail(ADMIN_EMAIL);
    if (!profile) {
      profile = await UserModel.createUser({
        email: ADMIN_EMAIL,
        fullName: 'Fleet Admin',
        role: 'admin',
        emailVerified: true,
      });
    } else if (profile.role !== 'admin') {
      profile = await UserModel.reconcileAdminRole(profile);
    }

    const securityMeta = await UserModel.getSecurityMeta(profile.id);
    if (securityMeta?.last_login_ip && securityMeta.last_login_ip !== ip) {
      logger.security('NEW_DEVICE_LOGIN', `Admin sign-in from a new IP (previously ${securityMeta.last_login_ip})`, { userId: profile.id, previousIp: securityMeta.last_login_ip, ip, userAgent }, { userId: profile.id });
    }
    await UserModel.recordLogin(profile.id, { ip, userAgent });

    const token = jwt.sign({ id: profile.id, email: profile.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });

    logger.success('AUTH_ADMIN_SIGNIN', `Admin signed in with email and password: ${ADMIN_EMAIL}`, { ip, userAgent }, { userId: profile.id });
    await logAuditEvent({
      eventType: SecurityEventTypes.ADMIN_ACCESS,
      actorType: 'ADMIN',
      req,
      userId: profile.id,
      userEmail: ADMIN_EMAIL,
      statusCode: 200,
      metadata: { action: 'ADMIN_SIGNIN', method: 'password' },
    });

    return res.json({ success: true, token, user: { ...profile, role: 'admin' } });
  } catch (err) {
    logger.error('AUTH_ADMIN_SIGNIN', 'Failed to complete admin sign-in', err);
    return res.status(500).json({ success: false, error: 'Admin sign in failed' });
  }
};
