const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { supabaseAdmin } = require('../config/db');
const UserModel = require('../models/userModel');
const { JWT_SECRET, ADMIN_EMAIL } = require('../middleware/authMiddleware');

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
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) {
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

      return res.json({
        success: true,
        token,
        user: profile
      });
    } catch (err) {
      console.error('AuthController.signUp Error:', err);
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
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
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

      return res.json({
        success: true,
        token,
        user: profile
      });
    } catch (err) {
      console.error('AuthController.signIn Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Sign in failed' });
    }
  }

  /**
   * Google OAuth Server-Side Authentication
   */
  static async googleAuth(req, res) {
    try {
      const { credential, idToken, accessToken } = req.body;
      const tokenToVerify = credential || idToken;

      let email, fullName, avatarUrl, sub;

      if (tokenToVerify) {
        // Verify Google ID Token
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
        // OAuth user info payload passed from frontend OAuth session
        email = req.body.user.email;
        fullName = req.body.user.fullName || req.body.user.name;
        avatarUrl = req.body.user.avatarUrl;
        sub = req.body.user.id;
      } else {
        return res.status(400).json({ success: false, error: 'Google credential or user data missing' });
      }

      const isDefaultAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // Find or create profile in Database
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

      return res.json({
        success: true,
        token,
        user: profile
      });
    } catch (err) {
      console.error('AuthController.googleAuth Error:', err);
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
        return res.status(44).json({ success: false, error: 'User profile not found' });
      }
      return res.json({ success: true, user: profile });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = AuthController;
