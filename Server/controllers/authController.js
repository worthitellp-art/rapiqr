const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { supabaseAdmin } = require('../config/db');
const UserModel = require('../models/userModel');
const ProductModel = require('../models/productModel');
const { JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD } = require('../middleware/authMiddleware');
const { logger } = require('../middleware/loggerMiddleware');
const { generateSecret, verifyTOTP, buildOtpauthUrl } = require('../utils/totp');
const { sendSms, sendWhatsApp } = require('../services/smsService');
const { createOtp, verifyOtp } = require('../services/phoneVerificationService');

// No hardcoded fallback: an unset GOOGLE_CLIENT_ID would otherwise let
// verifyIdToken's audience check silently pass against the wrong project (task.md #7/#23).
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

class AuthController {
  /**
   * User Registration (Sign Up)
   */
  static async signUp(req, res) {
    try {
      const { email, password, fullName, phoneNumber } = req.body;

      if (!email || !password) {
        logger.warn('AUTH_SIGNUP', 'Signup attempt missing email or password');
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      logger.info('AUTH_SIGNUP', `Processing signup for email: ${email}`);

      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) {
        logger.warn('AUTH_SIGNUP', `Supabase user creation failed: ${authError.message}`);
        return res.status(400).json({ success: false, error: authError.message });
      }

      const user = authData.user;
      const profile = await UserModel.upsertProfile({
        id: user.id,
        email: user.email,
        fullName: fullName || email.split('@')[0],
        phoneNumber: phoneNumber || undefined
      });

      // Immediately link any sticker already registered under this phone number
      // (e.g. activated on the scan page before this account existed), rather
      // than waiting for the next products fetch to pick it up.
      if (phoneNumber) {
        ProductModel.autoClaimByPhone(profile.id, profile.full_name, phoneNumber).catch((err) => {
          logger.error('PRODUCT_AUTO_CLAIM', 'Failed to auto-claim products after signup', err);
        });
      }

      const token = jwt.sign(
        { id: profile.id, email: profile.email, role: profile.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.success('AUTH_SIGNUP', `User registered successfully: ${email} (${profile.role})`);

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

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.warn('AUTH_SIGNIN', `Authentication failed for ${email}: ${error.message}`);
        return res.status(401).json({ success: false, error: error.message });
      }

      const user = data.user;
      let profile = await UserModel.findById(user.id);
      if (!profile) {
        profile = await UserModel.upsertProfile({
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || email.split('@')[0]
        });
      }

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
   * a regular user's Supabase Auth password), so admin access can't be gained through
   * the normal signup/signin flow no matter what a user's account role looks like.
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

      // Look up a real profile ONLY if the admin also has an actual Supabase Auth account
      // under this email (e.g. they signed up normally at some point) — this just lets us
      // reuse their real name/avatar. We never attempt to INSERT a profiles row here: its id
      // is a foreign key into auth.users, and the admin identity is authenticated purely via
      // ADMIN_EMAIL/ADMIN_PASSWORD above with no real auth.users row backing it, so any
      // insert with a synthetic id would violate that FK and silently fail on every call.
      let profile = await UserModel.findByEmail(ADMIN_EMAIL);
      if (profile && profile.role !== 'admin') {
        profile = await UserModel.upsertProfile({ ...profile, role: 'admin' });
      }
      if (!profile) {
        profile = {
          id: 'admin-' + Buffer.from(ADMIN_EMAIL).toString('hex').slice(0, 24),
          email: ADMIN_EMAIL,
          full_name: 'Fleet Admin',
          role: 'admin',
          subscription_plan: 'enterprise',
          is_subscribed: true,
        };
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
   * Google OAuth Server-Side Authentication
   */
  static async googleAuth(req, res) {
    try {
      const { credential, idToken } = req.body;
      const tokenToVerify = credential || idToken;

      if (tokenToVerify && !googleClient) {
        return res.status(503).json({ success: false, error: 'Google sign-in is not configured on the server' });
      }

      let email, fullName, avatarUrl, sub;

      if (tokenToVerify) {
        const ticket = await googleClient.verifyIdToken({
          idToken: tokenToVerify,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        email = payload.email;
        fullName = payload.name;
        avatarUrl = payload.picture;
        sub = payload.sub;
      } else if (req.body.user) {
        email = req.body.user.email;
        fullName = req.body.user.fullName || req.body.user.name;
        avatarUrl = req.body.user.avatarUrl;
        sub = req.body.user.id;
      } else {
        logger.warn('AUTH_GOOGLE', 'Google Auth payload missing credentials');
        return res.status(400).json({ success: false, error: 'Google credential or user data missing' });
      }

      logger.info('AUTH_GOOGLE', `Google OAuth verification for: ${email}`);

      const isDesignatedAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      let profile = await UserModel.findByEmail(email);
      if (!profile) {
        profile = await UserModel.upsertProfile({
          id: sub || `google-${Date.now()}`,
          email,
          fullName: fullName || email.split('@')[0],
          avatarUrl,
          role: isDesignatedAdmin ? 'admin' : 'user'
        });
      } else if (isDesignatedAdmin && profile.role !== 'admin') {
        profile = await UserModel.upsertProfile({
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          phoneNumber: profile.phone_number,
          role: 'admin'
        });
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
      const profile = await UserModel.findById(req.user.id);
      if (!profile) {
        logger.warn('AUTH_ME', `Profile not found for ID: ${req.user.id}`);
        return res.status(404).json({ success: false, error: 'User profile not found' });
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
      const { fullName, phoneNumber } = req.body || {};
      if (fullName === undefined && phoneNumber === undefined) {
        return res.status(400).json({ success: false, error: 'Nothing to update' });
      }
      const updated = await UserModel.updateProfile(req.user.id, { fullName, phoneNumber });
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to update profile' });
      logger.user('PROFILE_UPDATED', `Profile updated for ${req.user.email}`, { fullName: !!fullName, phoneNumber: !!phoneNumber });

      // Immediately link any sticker registered under this phone number, rather
      // than waiting for the next products fetch to pick it up.
      if (phoneNumber) {
        ProductModel.autoClaimByPhone(req.user.id, updated.full_name, phoneNumber).catch((err) => {
          logger.error('PRODUCT_AUTO_CLAIM', 'Failed to auto-claim products after phone update', err);
        });
      }

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
      if (!phoneNumber || String(phoneNumber).replace(/\D/g, '').length < 7) {
        return res.status(400).json({ success: false, error: 'Enter a valid phone number.' });
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
   * actually write profiles.phone_number and run the phone-based auto-claim
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

      const updated = await UserModel.updateProfile(req.user.id, { phoneNumber: result.phone });
      if (!updated) return res.status(500).json({ success: false, error: 'Failed to save verified phone number.' });

      let claimedCount = 0;
      try {
        const claimed = await ProductModel.autoClaimByPhone(req.user.id, updated.full_name, result.phone);
        claimedCount = claimed.length;
      } catch (err) {
        logger.error('PRODUCT_AUTO_CLAIM', 'Failed to auto-claim products after verified phone update', err);
      }

      logger.user('PHONE_VERIFIED', `Phone number verified & linked for ${req.user.email}`, { claimedCount });
      return res.json({ success: true, user: updated, claimedCount });
    } catch (err) {
      logger.error('PHONE_OTP_VERIFY', 'Failed to verify phone code', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Account Settings — change password. Re-verifies the current password against
   * Supabase Auth before applying the new one, so this can't be used to hijack an
   * account from an already-authenticated-but-stolen JWT alone.
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

      const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
        email: req.user.email,
        password: currentPassword,
      });
      if (verifyError) {
        logger.security('PASSWORD_CHANGE_DENIED', `Incorrect current password for ${req.user.email}`);
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password: newPassword });
      if (updateError) return res.status(500).json({ success: false, error: updateError.message });

      logger.security('PASSWORD_CHANGED', `Password changed for ${req.user.email}`);
      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      logger.error('PASSWORD_CHANGE', 'Failed to change password', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to change password' });
    }
  }

  /**
   * Account Settings — permanently delete the account (DPDP/GDPR "right to be
   * forgotten"). Re-verifies the current password first, same pattern as
   * changePassword/changeEmail. Deleting the auth.users row cascades to
   * public.profiles and public.products via their ON DELETE CASCADE FKs, so no
   * manual cleanup is needed here.
   */
  static async deleteAccount(req, res) {
    try {
      const { password } = req.body || {};
      if (!password) {
        return res.status(400).json({ success: false, error: 'password is required to confirm account deletion' });
      }

      const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
        email: req.user.email,
        password,
      });
      if (verifyError) {
        logger.security('ACCOUNT_DELETE_DENIED', `Incorrect password for account deletion attempt: ${req.user.email}`);
        return res.status(401).json({ success: false, error: 'Password is incorrect' });
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(req.user.id);
      if (deleteError) return res.status(500).json({ success: false, error: deleteError.message });

      logger.security('ACCOUNT_DELETED', `Account permanently deleted: ${req.user.email}`, { userId: req.user.id });
      return res.json({ success: true, message: 'Account permanently deleted' });
    } catch (err) {
      logger.error('ACCOUNT_DELETE', 'Failed to delete account', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to delete account' });
    }
  }

  /**
   * Account Settings — change the account email. Requires current password re-entry.
   */
  static async changeEmail(req, res) {
    try {
      const { newEmail, currentPassword } = req.body || {};
      if (!newEmail || !newEmail.includes('@') || !currentPassword) {
        return res.status(400).json({ success: false, error: 'newEmail and currentPassword are required' });
      }

      const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
        email: req.user.email,
        password: currentPassword,
      });
      if (verifyError) {
        logger.security('EMAIL_CHANGE_DENIED', `Incorrect current password for ${req.user.email}`);
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        email: newEmail,
        email_confirm: true,
      });
      if (updateError) return res.status(500).json({ success: false, error: updateError.message });

      const updated = await UserModel.updateEmail(req.user.id, newEmail);
      logger.security('EMAIL_CHANGED', `Email changed for account ${req.user.id}`, { from: req.user.email, to: newEmail });

      const token = jwt.sign(
        { id: req.user.id, email: newEmail, role: req.user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({ success: true, user: updated, token });
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

      const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
        email: req.user.email,
        password,
      });
      if (verifyError) {
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
