const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'namoqr_secure_server_jwt_secret_key_2026';
const ADMIN_EMAIL = 'worthitellp@gmail.com';

/**
 * Verify JWT or Supabase session token
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    // First try standard server JWT verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // Fallback: Verify with Supabase auth admin
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user'
      };
      return next();
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Authentication middleware failure' });
  }
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
  verifyAdmin,
  JWT_SECRET,
  ADMIN_EMAIL
};
