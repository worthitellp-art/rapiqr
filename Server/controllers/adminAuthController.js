const path = require('path');
const dotenv = require('dotenv');
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
 * Admin Fleet Panel sign-in: email + password. Only ADMIN_EMAIL can sign in.
 * Password is verified against ADMIN_PASSWORD_HASH (bcrypt) or ADMIN_PASSWORD in .env.
 * POST /api/auth/admin-login   Body: { email, password }
 */
exports.adminLogin = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    // If neither password hash nor plain password is in process.env, reload .env dynamically
    let passwordHash = (process.env.ADMIN_PASSWORD_HASH || '').trim().replace(/^["']|["']$/g, '');
    let plainPassword = (process.env.ADMIN_PASSWORD || '').trim().replace(/^["']|["']$/g, '');

    if (!passwordHash && !plainPassword) {
      try {
        dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });
        dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), override: true });
        passwordHash = (process.env.ADMIN_PASSWORD_HASH || '').trim().replace(/^["']|["']$/g, '');
        plainPassword = (process.env.ADMIN_PASSWORD || '').trim().replace(/^["']|["']$/g, '');
      } catch {}
    }

    const configuredAdminEmail = (process.env.ADMIN_EMAIL || ADMIN_EMAIL || 'worthitellp@gmail.com')
      .trim()
      .replace(/^["']|["']$/g, '')
      .toLowerCase();

    if (!passwordHash && !plainPassword) {
      return res.status(503).json({ success: false, error: 'Admin sign-in is not configured on the server.' });
    }
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const attemptKey = `admin-login:${ip}`;
    let credentialsOk = false;

    if (email === configuredAdminEmail) {
      if (passwordHash) {
        credentialsOk = await verifyPassword(password, passwordHash);
      }
      if (!credentialsOk && plainPassword) {
        credentialsOk = (password === plainPassword);
      }
    }

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

    let profile = await UserModel.findByEmail(configuredAdminEmail);
    if (!profile) {
      profile = await UserModel.createUser({
        email: configuredAdminEmail,
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

    logger.success('AUTH_ADMIN_SIGNIN', `Admin signed in with email and password: ${configuredAdminEmail}`, { ip, userAgent }, { userId: profile.id });
    await logAuditEvent({
      eventType: SecurityEventTypes.ADMIN_ACCESS,
      actorType: 'ADMIN',
      req,
      userId: profile.id,
      userEmail: configuredAdminEmail,
      statusCode: 200,
      metadata: { action: 'ADMIN_SIGNIN', method: 'password' },
    });

    return res.json({ success: true, token, user: { ...profile, role: 'admin' } });
  } catch (err) {
    logger.error('AUTH_ADMIN_SIGNIN', 'Failed to complete admin sign-in', err);
    return res.status(500).json({ success: false, error: 'Admin sign in failed' });
  }
};
