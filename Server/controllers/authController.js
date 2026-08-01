const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { supabaseAdmin } = require('../config/db');
const UserModel = require('../models/userModel');
const { JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD } = require('../middleware/authMiddleware');
const { logger } = require('../middleware/loggerMiddleware');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || '640446362534-73ub5mvtklhs4e3eldvde892q8jbtlbo.apps.googleusercontent.com'
);

class AuthController {
  /**
   * User Registration (Sign Up)
   */
  static async signUp(req, res) {
    try {
      const { email, password, fullName } = req.body;

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
        fullName: fullName || email.split('@')[0]
      });

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

      let profile = await UserModel.findByEmail(ADMIN_EMAIL);
      if (!profile) {
        profile = await UserModel.upsertProfile({
          id: 'admin-' + Buffer.from(ADMIN_EMAIL).toString('hex').slice(0, 24),
          email: ADMIN_EMAIL,
          fullName: 'Fleet Admin',
          role: 'admin',
        });
      } else if (profile.role !== 'admin') {
        profile = await UserModel.upsertProfile({ ...profile, role: 'admin' });
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

      const isDefaultAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      let profile = await UserModel.findByEmail(email);
      if (!profile) {
        profile = await UserModel.upsertProfile({
          id: sub || `google-${Date.now()}`,
          email,
          fullName: fullName || email.split('@')[0],
          avatarUrl,
          role: isDefaultAdmin ? 'admin' : 'user'
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
}

module.exports = AuthController;
