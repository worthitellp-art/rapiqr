/**
 * superAdminRoutes.js
 * ───────────────────
 * Separate route namespace for the SUPER_ADMIN panel.
 * Mounted at /api/super-admin in server.js.
 *
 * Auth chain:
 *   /auth/*   — no token required (login flow)
 *   All other — verifyToken → requireSuperAdmin → ipAllowlist (if configured)
 *
 * Sticker deletion uses requirePermission('stickers:delete_all') as an extra
 * fine-grained check on top of the SUPER_ADMIN role guard.
 */

const express = require('express');
const router  = express.Router();
const cookieParser = require('cookie-parser');

const SuperAdminAuthCtrl = require('../controllers/superAdminAuthController');
const SuperAdminCtrl     = require('../controllers/superAdminController');
const { verifyToken }    = require('../middleware/authMiddleware');
const {
  requireSuperAdmin,
  requirePermission,
  ipAllowlist,
  PERMISSIONS,
} = require('../middleware/rbacMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

// Parse cookies for httpOnly refresh token
router.use(cookieParser());

// ─── Auth sub-router (/api/super-admin/auth) ──────────────────────────────
// Tighter rate limit on login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please wait 15 minutes.',
});

router.post('/auth/login',           loginLimiter, SuperAdminAuthCtrl.login);
router.post('/auth/totp',            loginLimiter, SuperAdminAuthCtrl.verifyTotp);
router.post('/auth/refresh',         SuperAdminAuthCtrl.refresh);
router.post('/auth/logout',          SuperAdminAuthCtrl.logout);
router.post('/auth/change-password', SuperAdminAuthCtrl.changePassword);

// ─── Protected routes — must pass SUPER_ADMIN + IP allowlist ─────────────
router.use(verifyToken, requireSuperAdmin, ipAllowlist);

// Admin account management
router.get('/admins',              requirePermission(PERMISSIONS.USERS_READ),         SuperAdminCtrl.listAdmins);
router.post('/admins',             requirePermission(PERMISSIONS.USERS_MANAGE_ROLES), SuperAdminCtrl.createAdmin);
router.patch('/admins/:id/role',   requirePermission(PERMISSIONS.USERS_MANAGE_ROLES), SuperAdminCtrl.changeRole);
router.delete('/admins/:id',       requirePermission(PERMISSIONS.USERS_MANAGE_ROLES), SuperAdminCtrl.deleteAdmin);

// Nuclear sticker operations
router.delete('/stickers/all',     requirePermission(PERMISSIONS.STICKERS_DELETE_ALL), SuperAdminCtrl.deleteAllStickers);
router.delete('/stickers/bulk',    requirePermission(PERMISSIONS.STICKERS_DELETE),      SuperAdminCtrl.bulkDeleteStickers);

// Audit log
router.get('/audit',               requirePermission(PERMISSIONS.AUDIT_READ),    SuperAdminCtrl.getAuditLogs);

module.exports = router;
