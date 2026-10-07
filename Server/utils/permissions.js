/**
 * permissions.js — Master permission catalog & role defaults
 *
 * HOW TO USE:
 *   requirePermission('users:delete')  — checks if req.user has this permission
 *   requireRole('SUPER_ADMIN')         — checks req.user.role_name
 *
 * Permission strings follow the pattern:  resource:action
 * Add new permissions here; grant them to roles in ROLE_DEFAULT_PERMISSIONS.
 */

// ─── Flat permission registry ──────────────────────────────────────────────
const PERMISSIONS = Object.freeze({
  // Users
  USERS_READ:            'users:read',
  USERS_CREATE:          'users:create',
  USERS_UPDATE:          'users:update',
  USERS_DELETE:          'users:delete',
  USERS_RESET_PASSWORD:  'users:reset_password',
  USERS_DISABLE_2FA:     'users:disable_2fa',
  USERS_MANAGE_ROLES:    'users:manage_roles',   // SUPER_ADMIN only

  // Stickers / QR fleet
  STICKERS_READ:         'stickers:read',
  STICKERS_CREATE:       'stickers:create',
  STICKERS_UPDATE:       'stickers:update',
  STICKERS_DELETE:       'stickers:delete',
  STICKERS_DELETE_ALL:   'stickers:delete_all',  // destructive — SUPER_ADMIN only
  STICKERS_REVEAL_CODES: 'stickers:reveal_codes',
  STICKERS_PRINT:        'stickers:print',

  // Orders
  ORDERS_READ:           'orders:read',
  ORDERS_UPDATE:         'orders:update',
  ORDERS_DELETE:         'orders:delete',

  // Shop products
  SHOP_READ:             'shop:read',
  SHOP_CREATE:           'shop:create',
  SHOP_UPDATE:           'shop:update',
  SHOP_DELETE:           'shop:delete',

  // Communications / messages
  MESSAGES_READ:         'messages:read',
  MESSAGES_DELETE:       'messages:delete',

  // Alerts
  ALERTS_READ:           'alerts:read',
  ALERTS_CREATE:         'alerts:create',
  ALERTS_DELETE:         'alerts:delete',

  // Distributors
  DISTRIBUTORS_READ:     'distributors:read',
  DISTRIBUTORS_UPDATE:   'distributors:update',

  // Reviews
  REVIEWS_READ:          'reviews:read',
  REVIEWS_DELETE:        'reviews:delete',

  // Settings / config
  SETTINGS_READ:         'settings:read',
  SETTINGS_UPDATE:       'settings:update',

  // Audit logs
  AUDIT_READ:            'audit:read',
  AUDIT_EXPORT:          'audit:export',

  // Super-admin meta
  SUPER_ADMIN_ACTIONS:   'superadmin:actions',   // seed-break-glass, delete_all, manage_admins
});

// ─── Default permissions per RBAC role ────────────────────────────────────
const ROLE_DEFAULT_PERMISSIONS = Object.freeze({
  SUPER_ADMIN: Object.values(PERMISSIONS), // every permission

  ADMIN: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_RESET_PASSWORD,
    PERMISSIONS.USERS_DISABLE_2FA,
    PERMISSIONS.STICKERS_READ,
    PERMISSIONS.STICKERS_CREATE,
    PERMISSIONS.STICKERS_UPDATE,
    PERMISSIONS.STICKERS_DELETE,
    PERMISSIONS.STICKERS_REVEAL_CODES,
    PERMISSIONS.STICKERS_PRINT,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.SHOP_READ,
    PERMISSIONS.SHOP_CREATE,
    PERMISSIONS.SHOP_UPDATE,
    PERMISSIONS.SHOP_DELETE,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.MESSAGES_DELETE,
    PERMISSIONS.ALERTS_READ,
    PERMISSIONS.ALERTS_CREATE,
    PERMISSIONS.ALERTS_DELETE,
    PERMISSIONS.DISTRIBUTORS_READ,
    PERMISSIONS.DISTRIBUTORS_UPDATE,
    PERMISSIONS.REVIEWS_READ,
    PERMISSIONS.REVIEWS_DELETE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.AUDIT_READ,
  ],

  MANAGER: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.STICKERS_READ,
    PERMISSIONS.STICKERS_CREATE,
    PERMISSIONS.STICKERS_UPDATE,
    PERMISSIONS.STICKERS_PRINT,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.SHOP_READ,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.ALERTS_READ,
    PERMISSIONS.DISTRIBUTORS_READ,
    PERMISSIONS.REVIEWS_READ,
  ],

  USER: [],
});

module.exports = { PERMISSIONS, ROLE_DEFAULT_PERMISSIONS };
