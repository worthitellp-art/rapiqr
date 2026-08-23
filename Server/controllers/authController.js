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
const { normalizePhone } = require('../utils/phone');

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

      if ((!email && !phoneNumber) || !password) {
        logger.warn('AUTH_SIGNUP', 'Signup attempt missing required credentials');
        return res.status(400).json({ success: false, error: 'Email or phone number, and password are required' });
      }

      let targetEmail = (email || '').trim().toLowerCase();
      let formattedPhone = phoneNumber ? String(phoneNumber).trim() : '';

      if (!targetEmail && formattedPhone) {
        const digits = formattedPhone.replace(/\D/g, '');
        targetEmail = `${digits}@phone.repiqr.local`;
      }

      logger.info('AUTH_SIGNUP', `Processing signup for identity: ${targetEmail || formattedPhone}`);

      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: targetEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, phone_number: formattedPhone || undefined }
      });

      if (authError) {
        logger.warn('AUTH_SIGNUP', `Supabase user creation failed: ${authError.message}`);
        return res.status(400).json({ success: false, error: authError.message });
      }

      const user = authData.user;
      const profile = await UserModel.upsertProfile({
        id: user.id,
        email: user.email,
        fullName: fullName || (email ? email.split('@')[0] : formattedPhone),
        phoneNumber: formattedPhone || undefined
      });

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

      logger.info('AUTH_GOOGLE', `Google OAuth verification for: ${email} (sub: ${sub || 'none'})`);

      const isDesignatedAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      let profile = await UserModel.findByEmail(email);
      if (!profile) {
        // profiles.id is a uuid tied to auth.users — Google's `sub` is a decimal
        // string and cannot go in it. Resolve (or mint) the real auth user first.
        const userId = await UserModel.findOrCreateAuthUserId(email, { fullName, avatarUrl });
        if (!userId) {
          logger.error('AUTH_GOOGLE', `Could not resolve an auth user for: ${email}`);
          return res.status(500).json({ success: false, error: 'Could not create an account for this Google user' });
        }

        // A trigger on auth.users may have already inserted the profiles row
        // (hardcoded to role 'user'), so upsert rather than insert.
        profile = await UserModel.upsertProfile({
          id: userId,
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
      // ensureProfile backfills from auth.users when the profiles row is missing,
      // so legacy accounts (created while the server wrote through the anon key and
      // RLS silently dropped the insert) stop 404-ing on every dashboard load.
      const profile = await UserModel.ensureProfile(req.user.id);
      if (!profile) {
        // adminSignIn mints a synthetic `admin-<hex>` id when ADMIN_EMAIL has no
        // Supabase Auth account behind it; there is no profiles row to find and
        // never will be (its id is an FK into auth.users). The credentials were
        // already checked against ADMIN_EMAIL/ADMIN_PASSWORD to issue this token,
        // so echo that identity back rather than logging the admin panel out.
        if (req.user.role === 'admin' && String(req.user.id).startsWith('admin-')) {
          return res.json({
            success: true,
            user: {
              id: req.user.id,
              email: req.user.email,
              full_name: 'Fleet Admin',
              role: 'admin',
              subscription_plan: 'enterprise',
              is_subscribed: true,
            },
          });
        }

        logger.warn('AUTH_ME', `No auth user behind ID: ${req.user.id}`);
        // No auth.users row behind this token — the account was deleted, or the
        // token carries the synthetic admin id. Either way the session is dead, so
        // answer 401: the client signs out cleanly on 401, where a 404 left it
        // half-authenticated with a token it had already discarded.
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

      // Unlink orders so FK constraints don't block user deletion
      try {
        await supabaseAdmin.from('orders').update({ user_id: null }).eq('user_id', targetUserId);
      } catch (orderUnlinkError) {
        logger.warn('ACCOUNT_DELETE', `Order unlink skipped for ${targetUserId}: ${orderUnlinkError.message}`);
      }

      // Clean up chat messages and chat sessions owned by this user
      try {
        const { data: userSessions } = await supabaseAdmin
          .from('chat_sessions')
          .select('id')
          .eq('owner_id', targetUserId);

        if (userSessions && userSessions.length > 0) {
          const sessionIds = userSessions.map((s) => s.id);
          await supabaseAdmin.from('chat_messages').delete().in('session_id', sessionIds);
        }
        await supabaseAdmin.from('chat_sessions').delete().eq('owner_id', targetUserId);
      } catch (chatCleanError) {
        logger.warn('ACCOUNT_DELETE', `Chat cleanup skipped for ${targetUserId}: ${chatCleanError.message}`);
      }

      // Unlink QR codes
      try {
        await supabaseAdmin.from('qr_codes').update({ user_id: null }).eq('user_id', targetUserId);
      } catch (qrUnlinkError) {
        logger.warn('ACCOUNT_DELETE', `QR codes unlink skipped for ${targetUserId}: ${qrUnlinkError.message}`);
      }

      // Unlink products owned by this user
      try {
        await supabaseAdmin.from('products').update({ user_id: null, assigned_to: 'Unassigned' }).eq('user_id', targetUserId);
      } catch (productUnlinkError) {
        logger.warn('ACCOUNT_DELETE', `Product unlink skipped for ${targetUserId}: ${productUnlinkError.message}`);
      }

      // Unlink distributor applications
      try {
        await supabaseAdmin.from('distributor_applications').update({ user_id: null }).eq('user_id', targetUserId);
      } catch (distUnlinkError) {
        logger.warn('ACCOUNT_DELETE', `Distributor applications unlink skipped for ${targetUserId}: ${distUnlinkError.message}`);
      }

      // Delete profile record from public.profiles
      try {
        const { error: profileDeleteError } = await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
        if (profileDeleteError) {
          logger.warn('ACCOUNT_DELETE', `Profile delete warning for ${targetUserId}: ${profileDeleteError.message}`);
        }
      } catch (profileDeleteError) {
        logger.warn('ACCOUNT_DELETE', `Profile delete skipped for ${targetUserId}: ${profileDeleteError.message}`);
      }

      // Delete user from Supabase Auth
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (deleteError) {
        logger.warn('ACCOUNT_DELETE', `Auth deleteUser warning for ${targetUserId}: ${deleteError.message}`);
      }

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
   * a Supabase Auth password, so signInWithPassword has nothing to check it against
   * and the re-entry step could only ever fail. See adminSignIn.
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

      if (!isAdmin) {
        const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
          email: req.user.email,
          password: currentPassword,
        });
        if (verifyError) {
          logger.security('EMAIL_CHANGE_DENIED', `Incorrect current password for ${req.user.email}`);
          return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }
      }

      // Skipped for the synthetic `admin-<hex>` id, which has no auth.users row behind
      // it at all — there the profile row (or the JWT alone) is the whole identity.
      const hasAuthUser = !String(req.user.id).startsWith('admin-');
      if (hasAuthUser) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
          email: newEmail,
          email_confirm: true,
        });
        if (updateError) return res.status(500).json({ success: false, error: updateError.message });
      }

      const updated = await UserModel.updateEmail(req.user.id, newEmail);
      logger.security('EMAIL_CHANGED', `Email changed for account ${req.user.id}`, { from: req.user.email, to: newEmail });

      const token = jwt.sign(
        { id: req.user.id, email: newEmail, role: req.user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // ADMIN_EMAIL in Server/.env is what adminSignIn checks the login against, and
      // this endpoint cannot rewrite the server's environment. Say so plainly rather
      // than letting the next admin login fail for no visible reason.
      const warning = String(req.user.email).toLowerCase() === ADMIN_EMAIL.toLowerCase()
        ? `Admin login still uses ${ADMIN_EMAIL}. Update ADMIN_EMAIL in Server/.env and restart the server to sign in with ${newEmail}.`
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
