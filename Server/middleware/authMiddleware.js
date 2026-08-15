const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in Server/.env — refusing to start with an insecure default secret.');
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'worthitellp@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || null;

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

      const isDesignatedAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      let role = isDesignatedAdmin ? 'admin' : 'user';

      if (!isDesignatedAdmin) {
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.role === 'admin') {
            role = 'admin';
          }
        } catch { /* proceed with default role */ }
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: role
      };
      return next();
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Authentication middleware failure' });
  }
}

/**
 * Identifies the caller if a valid token is present, but never blocks the
 * request — for endpoints that must stay usable by guests (e.g. checkout)
 * while still linking the record to an account when the caller happens to
 * be logged in.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        const isDesignatedAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        let role = isDesignatedAdmin ? 'admin' : 'user';
        if (!isDesignatedAdmin) {
          try {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();
            if (profile?.role === 'admin') role = 'admin';
          } catch { /* proceed with default role */ }
        }
        req.user = {
          id: user.id,
          email: user.email,
          role: role
        };
      }
    } catch { /* invalid/expired token — proceed as guest */ }
  }
  next();
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
  optionalAuth,
  verifyAdmin,
  JWT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PASSWORD
};
