const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../models/userModel');
const ProductModel = require('../models/productModel');
const OrderModel = require('../models/orderModel');
const { JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD } = require('../middleware/authMiddleware');
const { logger } = require('../middleware/loggerMiddleware');
const { generateSecret, verifyTOTP, buildOtpauthUrl } = require('../utils/totp');
const { sendWhatsAppOtp } = require('../services/smsService');
const { verifyMsg91WidgetAccessToken } = require('../services/msg91Client');
const { createOtp, verifyOtp } = require('../services/phoneVerificationService');
const { createEmailOtp, verifyEmailOtp } = require('../services/emailOtpService');
const { normalizePhone } = require('../utils/phone');
const { hashPassword, verifyPassword } = require('../utils/passwords');
const { createResetToken, createResetLink, findUserByResetToken } = require('../services/passwordResetService');
const { sendEmail } = require('../services/emailService');
const { deleteUserAccount } = require('../services/accountDeletionService');
const loginAttemptTracker = require('../utils/loginAttemptTracker');
const SecurityEventTypes = require('../utils/securityEventTypes');
const { logAuditEvent } = require('../services/auditService');

// Same IP/origin extraction the request logger uses (loggerMiddleware.js), kept
// local here since these are recorded onto the user record, not just logged.
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
}
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

// No hardcoded fallback: an unset GOOGLE_CLIENT_ID would otherwise let
// verifyIdToken's audience check silently pass against the wrong project (task.md #7/#23).
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// A fixed bcrypt hash of a password nobody will ever type, compared against
// on every "unknown email" sign-in so that hashing a real password only ever
// happens on the success path — otherwise sign-in for an unknown email
// returns instantly while a known one takes ~100ms, and that timing gap is
// enough to enumerate which emails have accounts.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Vp1G3XLxaR7dyx7NcgCkJ6RxYWMKa';

class AuthController {
  /**
   * User Registration (Sign Up)
   */
  static async signUp(req, res) {
    try {
      const { email, password, fullName, phoneNumber } = req.body;

      if ((!email && !phoneNumber) || !password) {
        logger.warn('AUTH_SIGNUP', 'Signup attempt missing required credentials');
        return res.status(400).json({ success: false, error: 'Email or phone number, and password are required' });
      }
      if (String(password).length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }

      let targetEmail = (email || '').trim().toLowerCase();
      let formattedPhone = phoneNumber ? String(phoneNumber).trim() : '';

      if (!targetEmail && formattedPhone) {
        const digits = formattedPhone.replace(/\D/g, '');
        targetEmail = `${digits}@phone.repiqr.local`;
      }

      logger.info('AUTH_SIGNUP', `Processing signup for identity: ${targetEmail || formattedPhone}`);

      const existing = await UserModel.findByEmail(targetEmail);
      if (existing) {
        logger.warn('AUTH_SIGNUP', `Signup rejected — account already exists: ${targetEmail}`);
        return res.status(409).json({ success: false, error: 'An account with this email already exists' });
      }

      const passwordHash = await hashPassword(password);
      const isDesignatedAdmin = targetEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      let profile;
      try {
        profile = await UserModel.createUser({
          email: targetEmail,
          passwordHash,
          fullName: fullName || (email ? email.split('@')[0] : formattedPhone),
          phoneNumber: formattedPhone || undefined,
          role: isDesignatedAdmin ? 'admin' : 'user',
          emailVerified: true,
        });
      } catch (createErr) {
        if (createErr.code === 11000) {
          return res.status(409).json({ success: false, error: 'An account with this email already exists' });
        }
        throw createErr;
      }

      const token = jwt.sign(
        { id: profile.id, email: profile.email, role: profile.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Link any prior guest checkout orders placed with this email or phone number
      await OrderModel.linkGuestOrdersToUser(profile.id, profile.email, profile.phoneNumber).catch((linkErr) => {
        logger.warn('AUTH_SIGNUP', `Non-blocking error linking guest orders: ${linkErr.message}`);
      });

      logger.success('AUTH_SIGNUP', `User registered successfully: ${profile.email} (${profile.role})`);

      await logAuditEvent({
        eventType: SecurityEventTypes.USER_CREATED,
        actorType: 'USER',
        req,
        userId: profile.id,
        userEmail: profile.email,
        resourceType: 'USER',
        resourceId: profile.id,
        statusCode: 200,
        metadata: { role: profile.role, fullName: profile.fullName },
      });

      return res.json({
        success: true,
        token,
        user: profile
      });
    } catch (err) {
      logger.error('AUTH_SIGNUP', 'Error during signup process', err);
      return res.status(500).json({ success: false, error: err.message || 'Registration failed' });
    }
  }

  /**
   * User Sign In (Email / Password)
   */
  static async signIn(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        logger.warn('AUTH_SIGNIN', 'Sign-in attempt missing credentials');
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      logger.info('AUTH_SIGNIN', `Attempting authentication for email: ${email}`);

      const ip = getClientIp(req);
      const userAgent = getUserAgent(req);
      const rawIdentifier = String(email || '').trim();
      const normalizedEmail = rawIdentifier.toLowerCase().replace(/^["']|["']$/g, '');
      const inputPassword = String(password || '').trim();
      const configuredAdminEmail = ADMIN_EMAIL.trim().toLowerCase().replace(/^["']|["']$/g, '');
      const configuredAdminPassword = ADMIN_PASSWORD ? ADMIN_PASSWORD.trim().replace(/^["']|["']$/g, '') : null;

      const isDesignatedAdmin = normalizedEmail === configuredAdminEmail;
      const isAdminPasswordMatch = isDesignatedAdmin && configuredAdminPassword && inputPassword === configuredAdminPassword;

      let authUser = await UserModel.findAuthByEmail(normalizedEmail);
      if (!authUser && !rawIdentifier.includes('@')) {
        const digits = rawIdentifier.replace(/\D/g, '');
        if (digits.length >= 10) {
          authUser = await UserModel.findAuthByEmail(`${digits.slice(-10)}@phone.repiqr.local`);
          if (!authUser) {
            const phoneUser = await UserModel.findByPhone(rawIdentifier);
            if (phoneUser) {
              authUser = await UserModel.findAuthById(phoneUser.id);
            }
          }
        }
      }

      // If user row doesn't exist yet but credentials match configured admin credentials, auto-provision
      if (!authUser && isDesignatedAdmin && isAdminPasswordMatch) {
        let adminProfile = await UserModel.findByEmail(configuredAdminEmail);
        if (!adminProfile) {
          adminProfile = await UserModel.createUser({
            email: ADMIN_EMAIL,
            fullName: 'Fleet Admin',
            role: 'admin',
            emailVerified: true,
          });
        }

        const token = jwt.sign(
          { id: adminProfile.id, email: adminProfile.email, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        await UserModel.recordLogin(adminProfile.id, { ip, userAgent });
        logger.success('AUTH_SIGNIN', `Admin signed in successfully via signin: ${ADMIN_EMAIL}`, { ip, userAgent }, { userId: adminProfile.id });
        return res.json({ success: true, token, user: { ...adminProfile, role: 'admin' } });
      }

      const hashToCheck = authUser?.password_hash || DUMMY_HASH;
      let passwordOk = await verifyPassword(password, hashToCheck);
      if (!passwordOk && isAdminPasswordMatch) {
        passwordOk = true;
      }

      if (!authUser || (!authUser.password_hash && !isAdminPasswordMatch) || !passwordOk) {
        const failCount = loginAttemptTracker.recordFailure(normalizedEmail);
        logger.warn('AUTH_SIGNIN', `Authentication failed for ${email}`, { ip, failCount });
        if (failCount >= loginAttemptTracker.SUSPICIOUS_THRESHOLD) {
          logger.security('SUSPICIOUS_LOGIN_ATTEMPTS', `${failCount} failed sign-in attempts for ${email} within 15 minutes`, { email: normalizedEmail, ip, userAgent, failCount });
        }

        await logAuditEvent({
          eventType: SecurityEventTypes.AUTH_LOGIN_FAILED,
          actorType: 'ANONYMOUS',
          req,
          userEmail: normalizedEmail,
          statusCode: 401,
          reason: 'Invalid email or password',
          metadata: { failCount },
        });

        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      loginAttemptTracker.clear(normalizedEmail);

      const securityMeta = await UserModel.getSecurityMeta(authUser._id);
      const profile = await UserModel.reconcileAdminRole(await UserModel.findById(authUser._id));

      const token = jwt.sign(
        { id: profile.id, email: profile.email, role: profile.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      if (securityMeta?.last_login_ip && securityMeta.last_login_ip !== ip) {
        logger.security('NEW_DEVICE_LOGIN', `Sign-in for ${email} from a new IP (previously ${securityMeta.last_login_ip})`, { userId: profile.id, previousIp: securityMeta.last_login_ip, ip, userAgent }, { userId: profile.id });
      }
      await UserModel.recordLogin(profile.id, { ip, userAgent });

      // Automatically link previous guest checkout orders matching email or phone
      await OrderModel.linkGuestOrdersToUser(profile.id, profile.email, profile.phoneNumber).catch((linkErr) => {
        logger.warn('AUTH_SIGNIN', `Non-blocking error linking guest orders: ${linkErr.message}`);
      });

      logger.success('AUTH_SIGNIN', `User signed in successfully: ${email}`, { ip, userAgent }, { userId: profile.id });

      await logAuditEvent({
        eventType: SecurityEventTypes.AUTH_LOGIN_SUCCESS,
        actorType: profile.role === 'admin' ? 'ADMIN' : 'USER',
        req,
        userId: profile.id,
        userEmail: profile.email,
        statusCode: 200,
        metadata: { role: profile.role },
      });

      return res.json({
        success: true,
        token,
        user: profile
      });
    } catch (err) {
      logger.error('AUTH_SIGNIN', 'Sign in internal failure', err);
      return res.status(500).json({ success: false, error: err.message || 'Sign in failed' });
    }
  }

  /**
   * Admin Fleet Panel Sign In — the ONLY way to obtain an admin-role token.
   * Validated purely against ADMIN_EMAIL / ADMIN_PASSWORD in Server/.env (never against
   * a regular user's password), so admin access can't be gained through the normal
   * signup/signin flow no matter what a user's account role looks like.
   */
  static async adminSignIn(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        logger.warn('AUTH_ADMIN_SIGNIN', 'Admin sign-in attempt missing credentials');
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      if (!ADMIN_PASSWORD) {
        logger.error('AUTH_ADMIN_SIGNIN', 'ADMIN_PASSWORD is not configured on the server');
        return res.status(500).json({ success: false, error: 'Admin login is not configured.' });
      }

      const ip = getClientIp(req);
      const userAgent = getUserAgent(req);
      const inputEmail = String(email || '').trim().toLowerCase().replace(/^["']|["']$/g, '');
      const inputPassword = String(password || '').trim();
      const configuredAdminEmail = (process.env.ADMIN_EMAIL || ADMIN_EMAIL || 'worthitellp@gmail.com').trim().toLowerCase().replace(/^["']|["']$/g, '');
      const configuredAdminPassword = (process.env.ADMIN_PASSWORD || ADMIN_PASSWORD || 'Kp9#mX2$vW7!jR4&tQ8*zL5^yB').trim().replace(/^["']|["']$/g, '');
      const trackerKey = `admin:${configuredAdminEmail}`;

      if (inputEmail !== configuredAdminEmail || inputPassword !== configuredAdminPassword) {
        const failCount = loginAttemptTracker.recordFailure(trackerKey);
        logger.warn('AUTH_ADMIN_SIGNIN', `Admin login failed for ${email}`, { ip, failCount });
        // The admin account is the highest-value target in the system — any
        // repeated failure here (not just past the suspicious threshold) is
        // worth a SECURITY-category entry, not just a WARN one.
        logger.security('ADMIN_LOGIN_FAILED', `Failed admin sign-in attempt using email ${email}`, { attemptedEmail: email, ip, userAgent, failCount });

        await logAuditEvent({
          eventType: SecurityEventTypes.AUTH_LOGIN_FAILED,
          actorType: 'ANONYMOUS',
          req,
          userEmail: inputEmail,
          statusCode: 401,
          reason: 'Invalid admin credentials',
          metadata: { target: 'admin', failCount },
        });

        return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
      }

      loginAttemptTracker.clear(trackerKey);

      // The admin identity is authenticated purely via ADMIN_EMAIL/ADMIN_PASSWORD above,
      // never a stored password — reuse/create the profile row just for name/avatar/id.
      let profile = await UserModel.findByEmail(configuredAdminEmail);
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

      const token = jwt.sign(
        { id: profile.id, email: profile.email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.success('AUTH_ADMIN_SIGNIN', `Admin signed in: ${ADMIN_EMAIL}`, { ip, userAgent }, { userId: profile.id });

      await logAuditEvent({
        eventType: SecurityEventTypes.ADMIN_ACCESS,
        actorType: 'ADMIN',
        req,
        userId: profile.id,
        userEmail: configuredAdminEmail,
        statusCode: 200,
        metadata: { action: 'ADMIN_SIGNIN' },
      });

      return res.json({
        success: true,
        token,
        user: { ...profile, role: 'admin' }
      });
    } catch (err) {
      logger.error('AUTH_ADMIN_SIGNIN', 'Admin sign in internal failure', err);
      return res.status(500).json({ success: false, error: err.message || 'Admin sign in failed' });
    }
  }

  /**
   * Google OAuth Server-Side Authentication.
   *
   * Two supported inputs:
   *  - `credential`/`idToken`: a Google Identity Services ID token, verified
   *    offline via verifyIdToken — email/sub come from the verified payload.
   *  - `token`: an OAuth access token (what the frontend's implicit-grant
   *    popup flow actually sends). This MUST be verified against Google's
   *    tokeninfo endpoint server-side. The client also sends a `user` object
   *    with the profile it read from Google's userinfo endpoint, but that is
   *    untrusted input — trusting it directly would let anyone POST an
   *    arbitrary email (including the admin's) and receive a valid session
   *    for that account with no proof of ownership whatsoever. Only
   *    `fullName`/`avatarUrl` (cosmetic, not identity-bearing) are taken from it.
   */
  static async googleAuth(req, res) {
    try {
      const { credential, idToken, token: accessToken } = req.body || {};
      const idTokenToVerify = credential || idToken;

      if ((idTokenToVerify || accessToken) && !googleClient) {
        return res.status(503).json({ success: false, error: 'Google sign-in is not configured on the server' });
      }

      let email, sub;
      let fullName = req.body?.user?.fullName || req.body?.user?.name;
      let avatarUrl = req.body?.user?.avatarUrl || req.body?.user?.picture;

      if (idTokenToVerify) {
        const ticket = await googleClient.verifyIdToken({
          idToken: idTokenToVerify,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        email = payload.email;
        sub = payload.sub;
        fullName = payload.name || fullName;
        avatarUrl = payload.picture || avatarUrl;
      } else if (accessToken) {
        const tokenInfo = await googleClient.getTokenInfo(accessToken);
        if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
          logger.security('AUTH_GOOGLE_TOKEN_AUD_MISMATCH', `Google access token audience did not match this app (aud=${tokenInfo.aud})`);
          return res.status(401).json({ success: false, error: 'Invalid Google token' });
        }
        if (!tokenInfo.email || tokenInfo.email_verified === false) {
          return res.status(401).json({ success: false, error: 'This Google account\'s email is not verified' });
        }
        email = tokenInfo.email;
        sub = tokenInfo.sub || tokenInfo.user_id || null;
      } else {
        logger.warn('AUTH_GOOGLE', 'Google Auth payload missing a verifiable credential');
        return res.status(400).json({ success: false, error: 'A Google credential or access token is required' });
      }

      logger.info('AUTH_GOOGLE', `Google OAuth verification for: ${email} (sub: ${sub || 'none'})`);

      const isDesignatedAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      let profile = await UserModel.findByEmail(email);
      if (!profile) {
        profile = await UserModel.createUser({
          email,
          fullName: fullName || email.split('@')[0],
          googleId: sub || null,
          role: isDesignatedAdmin ? 'admin' : 'user',
          emailVerified: true,
        });
        if (avatarUrl) {
          profile = await UserModel.updateProfile(profile.id, { avatarUrl });
        }
      } else {
        // An account with this email already exists — before signing the
        // caller into it, confirm this Google identity actually IS that
        // account, not just an email-string match. Manual signup accepts any
        // typed email with no confirmation step, so without this check
        // someone could pre-register somebody else's email with a password
        // of their choosing and silently inherit whatever account the real
        // owner logs into later via Google — the Google token alone was
        // previously treated as sufficient proof to sign into ANY existing
        // account sharing that email, password or not.
        const authRecord = await UserModel.findAuthByEmail(email);
        const hasPassword = Boolean(authRecord?.password_hash);
        const alreadyLinkedToThisGoogleAccount = sub && authRecord?.google_id === sub;

        if (hasPassword && !alreadyLinkedToThisGoogleAccount) {
          logger.security('AUTH_GOOGLE_LINK_BLOCKED', `Google sign-in for ${email} matched an existing password account — blocked`, { userId: profile.id });
          return res.status(409).json({
            success: false,
            error: 'An account with this email already uses a password. Sign in with your password instead.',
          });
        }

        if (isDesignatedAdmin && profile.role !== 'admin') {
          profile = await UserModel.reconcileAdminRole(profile);
        }
        if (sub && authRecord?.google_id !== sub) {
          await UserModel.linkGoogleId(profile.id, sub);
        }
      }

      const ip = getClientIp(req);
      const userAgent = getUserAgent(req);
      const securityMeta = await UserModel.getSecurityMeta(profile.id);
      if (securityMeta?.last_login_ip && securityMeta.last_login_ip !== ip) {
        logger.security('NEW_DEVICE_LOGIN', `Google sign-in for ${email} from a new IP (previously ${securityMeta.last_login_ip})`, { userId: profile.id, previousIp: securityMeta.last_login_ip, ip, userAgent }, { userId: profile.id });
      }
      await UserModel.recordLogin(profile.id, { ip, userAgent });

      // Automatically link previous guest checkout orders matching email or phone
      await OrderModel.linkGuestOrdersToUser(profile.id, profile.email, profile.phoneNumber).catch((linkErr) => {
        logger.warn('AUTH_GOOGLE', `Non-blocking error linking guest orders: ${linkErr.message}`);
      });

      // Connect the exact sticker(s) any order placed with this email is owed
      // (auto-minted at checkout — see OrderModel.generateStickersForOrder)
      // straight to this account. Safe here specifically because Google just
      // proved this caller actually controls this inbox — see the trust-
      // boundary note on OrderModel.getStickerIdsByEmail.
      try {
        const orderStickerIds = await OrderModel.getStickerIdsByEmail(profile.email);
        if (orderStickerIds.length > 0) {
          const claimedByOrder = await ProductModel.claimStickersByIds(profile.id, profile.full_name, orderStickerIds);
          if (claimedByOrder.length > 0) {
            logger.rowUpdated('products', 'auto-claim-by-order-email', { userId: profile.id, count: claimedByOrder.length });
          }
        }
      } catch (err) {
        logger.error('ORDER_STICKER_CLAIM', 'Failed to claim order-linked stickers after Google sign-in', err);
      }

      const token = jwt.sign(
        { id: profile.id, email: profile.email, role: profile.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.success('AUTH_GOOGLE', `Google OAuth login succeeded for: ${email}`, { ip, userAgent }, { userId: profile.id });

      return res.json({
        success: true,
        token,
        user: profile
      });
    } catch (err) {
      logger.error('AUTH_GOOGLE', 'Google auth failure', err);
      return res.status(500).json({ success: false, error: err.message || 'Google authentication failed' });
    }
  }

  /**
   * Passwordless email login — step 1. Sends a 6-digit one-time code to the
   * given address via Resend/SMTP (see emailService). No password is ever
   * involved: proving control of the inbox is the entire credential. Always
   * answers the same way whether or not the address has an account (same
   * enumeration reasoning as forgotPassword) — verifyEmailOtp below auto-creates
   * the account on first successful verification, same as googleAuth does.
   */
  static async sendEmailOtp(req, res) {
    try {
      const { email } = req.body || {};
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
      }

      const code = createEmailOtp(normalizedEmail);
      const result = await sendEmail({
        to: normalizedEmail,
        subject: 'Your RapiQR sign-in code',
        html: `<p>Your RapiQR sign-in code is <strong>${code}</strong>. It expires in 5 minutes.</p><p>If you didn't request this, you can safely ignore this email.</p>`,
        text: `Your RapiQR sign-in code is ${code}. It expires in 5 minutes.`,
        event: 'EMAIL_OTP_LOGIN',
      });

      logger.user('EMAIL_OTP_SENT', `Email sign-in code sent to ${normalizedEmail}`, { simulated: result.simulated });
      return res.json({ success: true, simulated: result.simulated });
    } catch (err) {
      logger.error('EMAIL_OTP_SEND', 'Failed to send email sign-in code', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Passwordless email login — step 2. Verifying the code IS the login: on a
   * match this signs into the existing account for that email, or creates one
   * (mirroring googleAuth's auto-provision), and returns a normal JWT session.
   * No password check is layered on top — code possession already proves the
   * strongest thing this app can prove, control of the inbox.
   */
  static async verifyEmailOtp(req, res) {
    try {
      const { email, code } = req.body || {};
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !code) {
        return res.status(400).json({ success: false, error: 'Email and code are required.' });
      }

      const result = verifyEmailOtp(normalizedEmail, code);
      if (!result.ok) {
        const messages = {
          no_pending_otp: 'No sign-in code in progress — request a new one.',
          expired: 'This code has expired — request a new one.',
          too_many_attempts: 'Too many incorrect attempts — request a new code.',
          invalid_code: `Incorrect code.${result.attemptsLeft ? ` ${result.attemptsLeft} attempt(s) left.` : ''}`,
        };
        return res.status(400).json({ success: false, error: messages[result.reason] || 'Verification failed.' });
      }

      const isDesignatedAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();

      let profile = await UserModel.findByEmail(normalizedEmail);
      if (!profile) {
        profile = await UserModel.createUser({
          email: normalizedEmail,
          fullName: normalizedEmail.split('@')[0],
          role: isDesignatedAdmin ? 'admin' : 'user',
          emailVerified: true,
        });
      } else if (isDesignatedAdmin && profile.role !== 'admin') {
        profile = await UserModel.reconcileAdminRole(profile);
      }

      const ip = getClientIp(req);
      const userAgent = getUserAgent(req);
      const securityMeta = await UserModel.getSecurityMeta(profile.id);
      if (securityMeta?.last_login_ip && securityMeta.last_login_ip !== ip) {
        logger.security('NEW_DEVICE_LOGIN', `Email OTP sign-in for ${normalizedEmail} from a new IP (previously ${securityMeta.last_login_ip})`, { userId: profile.id, previousIp: securityMeta.last_login_ip, ip, userAgent }, { userId: profile.id });
      }
      await UserModel.recordLogin(profile.id, { ip, userAgent });

      await OrderModel.linkGuestOrdersToUser(profile.id, profile.email, profile.phoneNumber).catch((linkErr) => {
        logger.warn('AUTH_EMAIL_OTP', `Non-blocking error linking guest orders: ${linkErr.message}`);
      });

      // Connect the exact sticker(s) any order placed with this email is owed
      // (auto-minted at checkout — see OrderModel.generateStickersForOrder)
      // straight to this account. Safe here specifically because the OTP
      // above just proved this caller actually controls this inbox — see the
      // trust-boundary note on OrderModel.getStickerIdsByEmail.
      try {
        const orderStickerIds = await OrderModel.getStickerIdsByEmail(profile.email);
        if (orderStickerIds.length > 0) {
          const claimedByOrder = await ProductModel.claimStickersByIds(profile.id, profile.full_name, orderStickerIds);
          if (claimedByOrder.length > 0) {
            logger.rowUpdated('products', 'auto-claim-by-order-email', { userId: profile.id, count: claimedByOrder.length });
          }
        }
      } catch (err) {
        logger.error('ORDER_STICKER_CLAIM', 'Failed to claim order-linked stickers after email OTP sign-in', err);
      }

      const token = jwt.sign(
        { id: profile.id, email: profile.email, role: profile.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.success('AUTH_EMAIL_OTP', `Email OTP sign-in succeeded for: ${normalizedEmail}`, { ip, userAgent }, { userId: profile.id });

      await logAuditEvent({
        eventType: SecurityEventTypes.AUTH_LOGIN_SUCCESS,
        actorType: profile.role === 'admin' ? 'ADMIN' : 'USER',
        req,
        userId: profile.id,
        userEmail: profile.email,
        statusCode: 200,
        metadata: { role: profile.role, method: 'email_otp' },
      });

      return res.json({ success: true, token, user: profile });
    } catch (err) {
      logger.error('EMAIL_OTP_VERIFY', 'Failed to verify email sign-in code', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * User Sign Out. JWTs here are stateless (no server-side session store), so
   * this cannot revoke the token itself — the client is responsible for
   * discarding it. What this endpoint does do is write an explicit LOGOUT
   * audit entry (who, when, from where), which the login side alone can't
   * produce, closing the "who logged in / who logged out" pair.
   */
  static async logout(req, res) {
    try {
      if (req.user?.id) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);
        await UserModel.recordLogout(req.user.id);
        logger.security('LOGOUT', `User signed out: ${req.user.email || req.user.id}`, { ip, userAgent }, { userId: req.user.id });

        await logAuditEvent({
          eventType: SecurityEventTypes.AUTH_LOGOUT,
          actorType: req.user?.role === 'admin' ? 'ADMIN' : 'USER',
          req,
          userId: req.user?.id,
          userEmail: req.user?.email,
          statusCode: 200,
        });
      }
      return res.json({ success: true, message: 'Signed out' });
    } catch (err) {
      logger.error('AUTH_LOGOUT', 'Failed to record logout', err);
      // Sign-out is client-driven (token discard) — never block it on a logging failure.
      return res.json({ success: true, message: 'Signed out' });
    }
  }

  /**
   * Get Current Authenticated User Profile
   */
  static async getMe(req, res) {
    try {
      const profile = await UserModel.ensureProfile(req.user.id);
      if (!profile) {
        logger.warn('AUTH_ME', `No account behind ID: ${req.user.id}`);
        // The account was deleted, or the token is stale. Answer 401: the
        // client signs out cleanly on 401, where a 404 left it half-authenticated
        // with a token it had already discarded.
        return res.status(401).json({ success: false, error: 'Session no longer valid — please sign in again.' });
      }
      return res.json({ success: true, user: profile });
    } catch (err) {
      logger.error('AUTH_ME', 'Failed to fetch user profile', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Account Settings — update owner's display name / phone number.
   */
  static async updateProfile(req, res) {
    try {
      const { fullName, phoneNumber, avatarUrl } = req.body || {};

      // Phone numbers do NOT change here. This endpoint set the number straight onto
      // the account with no proof of ownership and then auto-claimed every sticker
      // registered under it — typing a stranger's number was enough to pull their
      // stickers into your dashboard, which is exactly what the OTP flow exists to
      // prevent. sendPhoneOtp -> verifyPhoneOtp is the only way in.
      if (phoneNumber !== undefined) {
        return res.status(400).json({
          success: false,
          error: 'Phone numbers must be verified. Request a code with /auth/phone/send-otp first.',
        });
      }

      if (fullName === undefined && avatarUrl === undefined) {
        return res.status(400).json({ success: false, error: 'Nothing to update' });
      }

      const updated = await UserModel.updateProfile(req.user.id, { fullName, avatarUrl });
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to update profile' });
      logger.user('PROFILE_UPDATED', `Profile updated for ${req.user.email}`, { fullName: !!fullName, avatar: !!avatarUrl });

      return res.json({ success: true, user: updated });
    } catch (err) {
      logger.error('PROFILE_UPDATE', 'Failed to update profile', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Phone verification step 1 — validate the candidate number and confirm it
   * isn't already claimed. The actual OTP send now happens entirely in the
   * browser via the MSG91 OTP Widget (see src/lib/msg91Widget.ts) — this
   * endpoint is only the pre-flight "is this worth showing the OTP screen for"
   * check, so a doomed attempt fails before the widget spends a send on it.
   */
  static async sendPhoneOtp(req, res) {
    try {
      const { phoneNumber } = req.body || {};
      if (!normalizePhone(phoneNumber)) {
        return res.status(400).json({ success: false, error: 'Enter a valid 10-digit mobile number.' });
      }

      // The admin console is not a sticker dashboard — it sees every sticker in the
      // fleet regardless. Giving the admin account a phone number only made it
      // compete with the real owner for the stickers registered under it.
      if (req.user.role === 'admin') {
        return res.status(400).json({
          success: false,
          error: 'The admin account does not use a phone number.',
        });
      }

      // One number, one dashboard. Checked here so the user finds out before we
      // spend an SMS, and again at verify time in case the number was taken in between.
      const taken = await UserModel.findByPhone(phoneNumber, { excludeUserId: req.user.id });
      if (taken) {
        logger.security('PHONE_ALREADY_LINKED', `Phone already on another account, rejected for ${req.user.email}`);
        return res.status(409).json({
          success: false,
          error: 'This number is already linked to another RapiQR account. Sign in to that account, or remove the number there first.',
        });
      }

      logger.user('PHONE_OTP_SEND_CHECKED', `Phone verification pre-check passed for ${req.user.email} — widget will send the OTP`);
      return res.json({ success: true });
    } catch (err) {
      logger.error('PHONE_OTP_SEND', 'Failed to run phone verification pre-check', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Phone verification step 2 — the browser already ran the OTP exchange with
   * MSG91's widget and got back an access token; this verifies that token with
   * MSG91 server-to-server (never trusting the frontend's own "success" claim)
   * and confirms it verified the SAME number the client says it did, then only
   * on a match does this write the account's phone number and run the
   * phone-based auto-claim (Server/models/productModel.js autoClaimByPhone), so
   * a sticker only ever lands in a dashboard once ownership of the phone number
   * is proven.
   */
  static async verifyPhoneOtp(req, res) {
    try {
      const { accessToken, phoneNumber } = req.body || {};
      if (!accessToken) return res.status(400).json({ success: false, error: 'Missing verification token — please retry.' });
      if (!normalizePhone(phoneNumber)) {
        return res.status(400).json({ success: false, error: 'Enter a valid 10-digit mobile number.' });
      }

      const verification = await verifyMsg91WidgetAccessToken({ accessToken });
      if (!verification.success) {
        logger.security('PHONE_OTP_VERIFY_FAILED', `MSG91 widget token rejected for ${req.user.email}: ${verification.error || verification.reason}`);
        return res.status(400).json({ success: false, error: verification.error || 'Invalid or expired verification code.' });
      }

      // MSG91 confirms a number was verified — but not necessarily the one this
      // request claims. Without this check a token minted for one number could be
      // replayed to claim a different one.
      if (normalizePhone(verification.verifiedIdentifier) !== normalizePhone(phoneNumber)) {
        logger.security('PHONE_OTP_MISMATCH', `Verified identifier didn't match claimed number for ${req.user.email}`);
        return res.status(400).json({ success: false, error: 'Verified number does not match — please retry.' });
      }

      // Re-check ownership at the moment we commit: another account could have
      // verified the same number in between. Without this, two accounts end up
      // holding one number and both compete for its stickers.
      const taken = await UserModel.findByPhone(phoneNumber, { excludeUserId: req.user.id });
      if (taken) {
        logger.security('PHONE_ALREADY_LINKED', `Phone claimed by another account mid-verification for ${req.user.email}`);
        return res.status(409).json({
          success: false,
          error: 'This number was just linked to another RapiQR account. Only one account can hold a number.',
        });
      }

      await UserModel.mergeMetadata(req.user.id, {
        phone_verified: true,
        phone_verified_at: new Date().toISOString()
      });

      const updated = await UserModel.updateProfile(req.user.id, { phoneNumber });
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to save verified phone number.' });

      const finalProfile = (await UserModel.findById(req.user.id)) || updated;

      let claimedCount = 0;
      try {
        const claimed = await ProductModel.autoClaimByPhone(req.user.id, finalProfile.full_name, phoneNumber);
        claimedCount = claimed.length;
      } catch (err) {
        logger.error('PRODUCT_AUTO_CLAIM', 'Failed to auto-claim products after verified phone update', err);
      }

      // Connect the exact sticker(s) any order placed with this NOW-VERIFIED
      // phone number is owed (auto-minted at checkout — see
      // OrderModel.generateStickersForOrder) straight to this account. A
      // checkout-minted sticker has no owner phone of its own yet, so
      // autoClaimByPhone above can't find it by scanning sticker fields —
      // this goes through the order instead, which already proves the link.
      try {
        const orderStickerIds = await OrderModel.getStickerIdsByPhone(phoneNumber);
        if (orderStickerIds.length > 0) {
          const claimedByOrder = await ProductModel.claimStickersByIds(req.user.id, finalProfile.full_name, orderStickerIds);
          claimedCount += claimedByOrder.length;
        }
      } catch (err) {
        logger.error('ORDER_STICKER_CLAIM', 'Failed to claim order-linked stickers after verified phone update', err);
      }

      // Link any prior guest orders placed with this verified phone or email
      await OrderModel.linkGuestOrdersToUser(req.user.id, finalProfile.email, phoneNumber).catch((linkErr) => {
        logger.warn('PHONE_OTP_VERIFY', `Non-blocking error linking guest orders: ${linkErr.message}`);
      });

      logger.user('PHONE_VERIFIED', `Phone number verified & linked for ${req.user.email}`, { claimedCount });
      return res.json({ success: true, user: finalProfile, claimedCount });
    } catch (err) {
      logger.error('PHONE_OTP_VERIFY', 'Failed to verify phone code', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Account Settings — change password. Re-verifies the current password before
   * applying the new one, so this can't be used to hijack an account from an
   * already-authenticated-but-stolen JWT alone.
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'currentPassword and newPassword are required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      }

      const authUser = await UserModel.findAuthById(req.user.id);
      if (!authUser || !(await verifyPassword(currentPassword, authUser.password_hash))) {
        logger.security('PASSWORD_CHANGE_DENIED', `Incorrect current password for ${req.user.email}`);
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }

      const newHash = await hashPassword(newPassword);
      await UserModel.setPasswordHash(req.user.id, newHash);

      logger.security('PASSWORD_CHANGED', `Password changed for ${req.user.email}`);
      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      logger.error('PASSWORD_CHANGE', 'Failed to change password', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to change password' });
    }
  }

  /**
   * Self-service forgot-password: always answers the same way whether or not
   * the account exists — confirming/denying that an email has an account here
   * would itself be a data leak (email enumeration).
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

      const profile = await UserModel.findByEmail(email);
      if (profile) {
        const link = await createResetLink(profile);
        await sendEmail({
          to: profile.email,
          subject: 'Reset your RapiQR password',
          html: `<p>Hi ${profile.full_name || ''},</p><p>Click the link below to reset your RapiQR password. This link expires in 1 hour.</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
          event: 'PASSWORD_RESET_EMAIL',
        });
        logger.security('PASSWORD_RESET_REQUESTED', `Password reset requested for ${profile.email}`);
      } else {
        logger.warn('PASSWORD_RESET_REQUESTED', `Password reset requested for an email with no account`);
      }

      return res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
    } catch (err) {
      logger.error('PASSWORD_RESET_REQUEST', 'Failed to process forgot-password request', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Self-service password reset — consumes the token minted by forgotPassword
   * (or the admin-triggered equivalent in adminController).
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body || {};
      if (!token || !newPassword) {
        return res.status(400).json({ success: false, error: 'token and newPassword are required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      }

      const user = await findUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ success: false, error: 'This reset link is invalid or has expired.' });
      }

      const newHash = await hashPassword(newPassword);
      await UserModel.setPasswordHash(user._id, newHash);

      logger.security('PASSWORD_RESET_COMPLETED', `Password reset completed for ${user.email}`);
      return res.json({ success: true, message: 'Password updated. You can now sign in with your new password.' });
    } catch (err) {
      logger.error('PASSWORD_RESET', 'Failed to reset password', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Forgot-password via WhatsApp OTP — step 1. Alternative to the email-link
   * flow above for accounts with a verified phone number. Always answers the
   * same way whether or not the phone has an account, same enumeration
   * reasoning as forgotPassword.
   */
  static async forgotPasswordWhatsApp(req, res) {
    try {
      const { phoneNumber } = req.body || {};
      if (!normalizePhone(phoneNumber)) {
        return res.status(400).json({ success: false, error: 'Enter a valid 10-digit mobile number.' });
      }

      const profile = await UserModel.findByPhone(phoneNumber);
      if (profile) {
        const code = createOtp(`reset:${normalizePhone(phoneNumber)}`, phoneNumber);
        await sendWhatsAppOtp({ to: phoneNumber, code, event: 'PASSWORD_RESET_WHATSAPP' });
        logger.security('PASSWORD_RESET_REQUESTED', `WhatsApp password reset OTP requested for ${profile.email}`);
      } else {
        logger.warn('PASSWORD_RESET_REQUESTED', `WhatsApp password reset requested for a phone with no account`);
      }

      return res.json({ success: true, message: 'If an account exists for that number, a WhatsApp code has been sent.' });
    } catch (err) {
      logger.error('PASSWORD_RESET_REQUEST', 'Failed to process WhatsApp forgot-password request', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Forgot-password via WhatsApp OTP — step 2. Verifies the code, then mints
   * the same kind of reset token the email flow uses so the client finishes
   * through the existing POST /reset-password endpoint.
   */
  static async verifyForgotPasswordWhatsApp(req, res) {
    try {
      const { phoneNumber, code } = req.body || {};
      if (!normalizePhone(phoneNumber) || !code) {
        return res.status(400).json({ success: false, error: 'Phone number and code are required.' });
      }

      const result = verifyOtp(`reset:${normalizePhone(phoneNumber)}`, code);
      if (!result.ok) {
        const messages = {
          no_pending_otp: 'No reset code in progress — request a new one.',
          expired: 'This code has expired — request a new one.',
          too_many_attempts: 'Too many incorrect attempts — request a new code.',
          invalid_code: `Incorrect code.${result.attemptsLeft ? ` ${result.attemptsLeft} attempt(s) left.` : ''}`,
        };
        return res.status(400).json({ success: false, error: messages[result.reason] || 'Verification failed.' });
      }

      const profile = await UserModel.findByPhone(phoneNumber);
      if (!profile) {
        return res.status(400).json({ success: false, error: 'No account found for that number.' });
      }

      const resetToken = await createResetToken(profile);
      logger.security('PASSWORD_RESET_REQUESTED', `WhatsApp OTP verified, reset token issued for ${profile.email}`);
      return res.json({ success: true, resetToken });
    } catch (err) {
      logger.error('PASSWORD_RESET_REQUEST', 'Failed to verify WhatsApp forgot-password code', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Account Settings — permanently delete the authenticated user's account
   * and clean up associated profile/sticker records.
   */
  static async deleteAccount(req, res) {
    try {
      const targetUserId = req.user.id;
      const targetUserEmail = req.user.email;

      // The admin account is the fleet console itself, not a customer account —
      // deleting it would unlink every sticker it touches and lock the console out
      // with no way back short of editing the database by hand.
      if (req.user.role === 'admin' || String(targetUserEmail).toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        logger.security('ACCOUNT_DELETE_DENIED', `Admin account deletion refused: ${targetUserEmail}`);
        return res.status(403).json({
          success: false,
          error: 'The admin account cannot be deleted.',
        });
      }

      await deleteUserAccount(targetUserId);

      logger.security('ACCOUNT_DELETED', `Account permanently deleted: ${targetUserEmail}`, { userId: targetUserId });
      return res.json({ success: true, message: 'Account permanently deleted' });
    } catch (err) {
      logger.error('ACCOUNT_DELETE', 'Failed to delete account', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to delete account' });
    }
  }

  /**
   * Account Settings — change the account email.
   *
   * Regular accounts re-enter their current password. The admin account does not:
   * it authenticates against ADMIN_EMAIL/ADMIN_PASSWORD in Server/.env rather than
   * a stored password, so there is nothing to re-verify. See adminSignIn.
   */
  static async changeEmail(req, res) {
    try {
      const { newEmail, currentPassword } = req.body || {};
      const isAdmin = req.user.role === 'admin';

      if (!newEmail || !newEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Enter a valid email address' });
      }
      if (!isAdmin && !currentPassword) {
        return res.status(400).json({ success: false, error: 'newEmail and currentPassword are required' });
      }

      const normalizedNewEmail = String(newEmail).trim().toLowerCase();
      const collision = await UserModel.findByEmail(normalizedNewEmail);
      if (collision && collision.id !== req.user.id) {
        return res.status(409).json({ success: false, error: 'That email is already in use by another account.' });
      }

      if (!isAdmin) {
        const authUser = await UserModel.findAuthById(req.user.id);
        if (!authUser || !(await verifyPassword(currentPassword, authUser.password_hash))) {
          logger.security('EMAIL_CHANGE_DENIED', `Incorrect current password for ${req.user.email}`);
          return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }
      }

      let updated;
      try {
        updated = await UserModel.updateEmail(req.user.id, normalizedNewEmail);
      } catch (updateErr) {
        if (updateErr.code === 11000) {
          return res.status(409).json({ success: false, error: 'That email is already in use by another account.' });
        }
        throw updateErr;
      }

      logger.security('EMAIL_CHANGED', `Email changed for account ${req.user.id}`, { from: req.user.email, to: normalizedNewEmail });

      const token = jwt.sign(
        { id: req.user.id, email: normalizedNewEmail, role: req.user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // ADMIN_EMAIL in Server/.env is what adminSignIn checks the login against, and
      // this endpoint cannot rewrite the server's environment. Say so plainly rather
      // than letting the next admin login fail for no visible reason.
      const warning = String(req.user.email).toLowerCase() === ADMIN_EMAIL.toLowerCase()
        ? `Admin login still uses ${ADMIN_EMAIL}. Update ADMIN_EMAIL in Server/.env and restart the server to sign in with ${normalizedNewEmail}.`
        : undefined;

      return res.json({ success: true, user: updated, token, warning });
    } catch (err) {
      logger.error('EMAIL_CHANGE', 'Failed to change email', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to change email' });
    }
  }

  /**
   * 2FA Step 1 — generate a pending TOTP secret and return the manual-entry key +
   * otpauth:// URI (rendered as a QR code client-side). Not enabled until verified.
   */
  static async setupTwoFactor(req, res) {
    try {
      const secret = generateSecret();
      const otpauthUrl = buildOtpauthUrl({ secret, accountName: req.user.email });

      await UserModel.mergeMetadata(req.user.id, {
        twoFactor: { enabled: false, pendingSecret: secret },
      });

      logger.security('2FA_SETUP_STARTED', `2FA setup started for ${req.user.email}`);
      return res.json({ success: true, secret, otpauthUrl });
    } catch (err) {
      logger.error('2FA_SETUP', 'Failed to start 2FA setup', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * 2FA Step 2 — verify the 6-digit code from the authenticator app and enable 2FA.
   */
  static async verifyTwoFactor(req, res) {
    try {
      const { code } = req.body || {};
      const profile = await UserModel.findById(req.user.id);
      const pendingSecret = profile?.metadata?.twoFactor?.pendingSecret;

      if (!pendingSecret) {
        return res.status(400).json({ success: false, error: 'No pending 2FA setup found. Start setup again.' });
      }
      if (!verifyTOTP(pendingSecret, code)) {
        logger.security('2FA_VERIFY_FAILED', `Invalid 2FA verification code for ${req.user.email}`);
        return res.status(400).json({ success: false, error: 'Invalid code. Please try again.' });
      }

      await UserModel.mergeMetadata(req.user.id, {
        twoFactor: { enabled: true, secret: pendingSecret },
      });

      logger.security('2FA_ENABLED', `2FA enabled for ${req.user.email}`);
      return res.json({ success: true, message: '2FA enabled successfully' });
    } catch (err) {
      logger.error('2FA_VERIFY', 'Failed to verify 2FA code', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Disable 2FA — requires current password re-entry.
   */
  static async disableTwoFactor(req, res) {
    try {
      const { password } = req.body || {};
      if (!password) {
        return res.status(400).json({ success: false, error: 'Password is required to disable 2FA' });
      }

      const authUser = await UserModel.findAuthById(req.user.id);
      if (!authUser || !(await verifyPassword(password, authUser.password_hash))) {
        return res.status(401).json({ success: false, error: 'Incorrect password' });
      }

      await UserModel.mergeMetadata(req.user.id, {
        twoFactor: { enabled: false },
      });

      logger.security('2FA_DISABLED', `2FA disabled for ${req.user.email}`);
      return res.json({ success: true, message: '2FA disabled' });
    } catch (err) {
      logger.error('2FA_DISABLE', 'Failed to disable 2FA', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = AuthController;
