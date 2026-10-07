/**
 * rbacMiddleware.js — requireRole() and requirePermission() guards
 *
 * Usage:
 *   router.delete('/stickers', verifyToken, requireRole('SUPER_ADMIN'), handler)
 *   router.get('/users',       verifyToken, requirePermission('users:read'), handler)
 *
 * Both guards resolve the caller's effective permission set by:
 *   1. Looking up their role's default permissions (ROLE_DEFAULT_PERMISSIONS)
 *   2. Merging any extra_permissions stored on the user document
 *
 * The JWT carries { id, email, role_name, extra_permissions[] } — populated
 * by both the normal admin-login and the new super-admin-login endpoints.
 * No DB round-trip is needed on every request.
 */

const { ROLE_DEFAULT_PERMISSIONS, PERMISSIONS } = require('../utils/permissions');

/**
 * Derive the full effective permission set for a JWT payload.
 * @param {{ role_name?: string, extra_permissions?: string[] }} user
 * @returns {Set<string>}
 */
function effectivePermissions(user) {
  const base = ROLE_DEFAULT_PERMISSIONS[user?.role_name] || [];
  const extras = user?.extra_permissions || [];
  return new Set([...base, ...extras]);
}

/**
 * requireRole(...roles) — Allow only callers whose role_name is in the list.
 * Pass multiple roles for OR semantics: requireRole('SUPER_ADMIN', 'ADMIN')
 *
 * Must be used AFTER verifyToken (req.user must be set).
 */
function requireRole(...roles) {
  const allowed = new Set(roles.map((r) => r.toUpperCase()));
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (!allowed.has((req.user.role_name || '').toUpperCase())) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${[...allowed].join(' or ')}.`,
      });
    }
    return next();
  };
}

/**
 * requirePermission(permission) — Allow only callers who hold the given permission.
 * Prefers permission-based checks over raw role checks for forward compatibility.
 *
 * Must be used AFTER verifyToken (req.user must be set).
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    const perms = effectivePermissions(req.user);
    if (!perms.has(permission)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Required permission: ${permission}`,
      });
    }
    return next();
  };
}

/**
 * requireSuperAdmin — Convenience guard; shorthand for requireRole('SUPER_ADMIN').
 */
const requireSuperAdmin = requireRole('SUPER_ADMIN');

/**
 * requireAdminOrAbove — Shorthand for ADMIN or SUPER_ADMIN.
 */
const requireAdminOrAbove = requireRole('SUPER_ADMIN', 'ADMIN');

/**
 * ipAllowlist — Middleware that checks the request IP against the SUPER_ADMIN's
 * stored ip_allowlist. If the list is empty the check is skipped (opt-in).
 * Attach after verifyToken + requireSuperAdmin.
 */
async function ipAllowlist(req, res, next) {
  const { role_name, allowlist } = req.user || {};
  if (role_name !== 'SUPER_ADMIN') return next();
  if (!Array.isArray(allowlist) || allowlist.length === 0) return next();

  const clientIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip ||
    req.socket?.remoteAddress;

  if (!allowlist.includes(clientIp)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: your IP is not on the SUPER_ADMIN allowlist.',
    });
  }
  return next();
}

module.exports = {
  requireRole,
  requirePermission,
  requireSuperAdmin,
  requireAdminOrAbove,
  ipAllowlist,
  effectivePermissions,
  PERMISSIONS,
};
