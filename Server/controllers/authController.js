const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../models/userModel');
const ProductModel = require('../models/productModel');
const { JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD } = require('../middleware/authMiddleware');
const { logger } = require('../middleware/loggerMiddleware');
const { generateSecret, verifyTOTP, buildOtpauthUrl } = require('../utils/totp');
const { sendSms, sendWhatsApp } = require('../services/smsService');
const { createOtp, verifyOtp } = require('../services/phoneVerificationService');
const { normalizePhone } = require('../utils/phone');
const { hashPassword, verifyPassword } = require('../utils/passwords');
const { createResetLink, findUserByResetToken } = require('../services/passwordResetService');
const { sendEmail } = require('../services/emailService');
const { deleteUserAccount } = require('../services/accountDeletionService');

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

      logger.success('AUTH_SIGNUP', `User registered successfully: ${profile.email} (${profile.role})`);

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

      const authUser = await UserModel.findAuthByEmail(email);
      const hashToCheck = authUser?.password_hash || DUMMY_HASH;
      const passwordOk = await verifyPassword(password, hashToCheck);

      if (!authUser || !authUser.password_hash || !passwordOk) {
        logger.warn('AUTH_SIGNIN', `Authentication failed for ${email}`);
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const profile = await UserModel.reconcileAdminRole(await UserModel.findById(authUser._id));

      const token = jwt.sign(
        { id: profile.id, email: profile.email, role: profile.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.success('AUTH_SIGNIN', `User signed in successfully: ${email}`);

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

      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
        logger.warn('AUTH_ADMIN_SIGNIN', `Admin login failed for ${email}`);
        return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
      }

      // The admin identity is authenticated purely via ADMIN_EMAIL/ADMIN_PASSWORD above,
      // never a stored password — reuse/create the profile row just for name/avatar/id.
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

      const token = jwt.sign(
        { id: profile.id, email: profile.email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.success('AUTH_ADMIN_SIGNIN', `Admin signed in: ${ADMIN_EMAIL}`);

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
      } else if (isDesignatedAdmin && profile.role !== 'admin') {
        profile = await UserModel.reconcileAdminRole(profile);
      }

      const token = jwt.sign(
        { id: profile.id, email: profile.email, role: profile.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.success('AUTH_GOOGLE', `Google OAuth login succeeded for: ${email}`);

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
   * Phone verification step 1 — send a 6-digit code to the candidate number via
   * SMS + WhatsApp (real Twilio send, honestly reports back if unconfigured).
   * The number is NOT attached to the account until verifyPhoneOtp succeeds —
   * this is what closes the "type any phone and silently claim its stickers"
   * gap, since autoClaimByPhone only ever runs after a real code match.
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

      const code = createOtp(req.user.id, phoneNumber);
      const body = `Your RapiQR phone verification code is ${code}. It expires in 5 minutes.`;
      const [smsResult, whatsappResult] = await Promise.all([
        sendSms({ to: phoneNumber, body, event: 'PHONE_VERIFY_SMS' }),
        sendWhatsApp({ to: phoneNumber, body, event: 'PHONE_VERIFY_WHATSAPP' }),
      ]);

      const simulated = Boolean(smsResult.simulated && whatsappResult.simulated);
      logger.user('PHONE_OTP_SENT', `Phone verification code sent for ${req.user.email}`, { simulated });
      return res.json({ success: true, simulated });
    } catch (err) {
      logger.error('PHONE_OTP_SEND', 'Failed to send phone verification code', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Phone verification step 2 — check the code, and only on a match does this
   * actually write the account's phone number and run the phone-based auto-claim
   * (Server/models/productModel.js autoClaimByPhone), so a sticker only ever
   * lands in a dashboard once ownership of the phone number is proven.
   */
  static async verifyPhoneOtp(req, res) {
    try {
      const { code } = req.body || {};
      if (!code) return res.status(400).json({ success: false, error: 'Enter the code sent to your phone.' });

      const result = verifyOtp(req.user.id, code);
      if (!result.ok) {
        const messages = {
          no_pending_otp: 'No verification in progress — request a new code.',
          expired: 'This code has expired — request a new one.',
          too_many_attempts: 'Too many incorrect attempts — request a new code.',
          invalid_code: `Incorrect code.${result.attemptsLeft ? ` ${result.attemptsLeft} attempt(s) left.` : ''}`,
        };
        return res.status(400).json({ success: false, error: messages[result.reason] || 'Verification failed.' });
      }

      // Re-check ownership at the moment we commit: the code was issued minutes ago
      // and another account could have verified the same number in between. Without
      // this, two accounts end up holding one number and both compete for its stickers.
      const taken = await UserModel.findByPhone(result.phone, { excludeUserId: req.user.id });
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

      const updated = await UserModel.updateProfile(req.user.id, { phoneNumber: result.phone });
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to save verified phone number.' });

      const finalProfile = (await UserModel.findById(req.user.id)) || updated;

      let claimedCount = 0;
      try {
        const claimed = await ProductModel.autoClaimByPhone(req.user.id, finalProfile.full_name, result.phone);
        claimedCount = claimed.length;
      } catch (err) {
        logger.error('PRODUCT_AUTO_CLAIM', 'Failed to auto-claim products after verified phone update', err);
      }

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
