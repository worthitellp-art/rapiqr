/**
 * superAdminController.js
 * ──────────────────────
 * Business logic for SUPER_ADMIN panel actions:
 *   • List / update / delete users (any role)
 *   • Promote/demote roles (SUPER_ADMIN only)
 *   • Delete all stickers (requires superadmin:actions)
 *   • Manage admin accounts
 *   • Audit log access
 *
 * All actions are audit-logged with actor, target, IP, UA, timestamp.
 */

const bcrypt   = require('bcryptjs');
const User     = require('../models/schemas/User');
const QrModel  = require('../models/qrModel');
const { logAuditEvent }   = require('../services/auditService');
const { queryAuditLogs }  = require('../services/auditService');
const SecurityEventTypes  = require('../utils/securityEventTypes');
const { logger }          = require('../middleware/loggerMiddleware');
const { ROLE_DEFAULT_PERMISSIONS } = require('../utils/permissions');

// ─── List all staff accounts (ADMIN + SUPER_ADMIN) ────────────────────────
exports.listAdmins = async (req, res) => {
  try {
    const docs = await User.find({ role_name: { $in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] } })
      .select('email full_name role_name created_at last_login_at')
      .lean();

    return res.json({
      success: true,
      data: docs.map((d) => ({ ...d, id: String(d._id) })),
    });
  } catch (err) {
    logger.error('SUPER_ADMIN', 'listAdmins failed', err);
    return res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ─── Create a new admin account ───────────────────────────────────────────
exports.createAdmin = async (req, res) => {
  try {
    const { email, full_name, role_name = 'ADMIN', password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required.' });
    }
    const allowed = ['ADMIN', 'MANAGER'];
    if (!allowed.includes(role_name)) {
      return res.status(400).json({ success: false, error: `role_name must be one of: ${allowed.join(', ')}` });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already in use.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const doc  = await User.create({
      email:              email.toLowerCase().trim(),
      full_name:          full_name || null,
      role:               'admin',
      role_name,
      password_hash:      hash,
      must_change_password: true,
      email_verified:     true,
    });

    await logAuditEvent({
      eventType:    SecurityEventTypes.USER_CREATED,
      actorType:    'SUPER_ADMIN',
      req,
      resourceType: 'User',
      resourceId:   doc._id.toString(),
      metadata:     { role_name, email, created_by: req.user?.email },
    });

    return res.status(201).json({ success: true, data: { id: doc._id, email: doc.email, role_name } });
  } catch (err) {
    logger.error('SUPER_ADMIN', 'createAdmin failed', err);
    return res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ─── Change a user's role (SUPER_ADMIN only) ─────────────────────────────
exports.changeRole = async (req, res) => {
  try {
    const { id }           = req.params;
    const { role_name }    = req.body || {};
    const validRoles = ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(role_name)) {
      return res.status(400).json({ success: false, error: `role_name must be one of: ${validRoles.join(', ')}` });
    }

    const prev = await User.findById(id).select('email role_name').lean();
    if (!prev) return res.status(404).json({ success: false, error: 'User not found.' });

    const legacyRole = { SUPER_ADMIN: 'admin', ADMIN: 'admin', MANAGER: 'admin', USER: 'user' }[role_name] || 'user';
    await User.updateOne({ _id: id }, { $set: { role_name, role: legacyRole } });

    await logAuditEvent({
      eventType:    SecurityEventTypes.ROLE_CHANGED,
      actorType:    'SUPER_ADMIN',
      req,
      resourceType: 'User',
      resourceId:   id,
      metadata: {
        previous_role: prev.role_name,
        new_role:      role_name,
        target_email:  prev.email,
        changed_by:    req.user?.email,
      },
    });

    return res.json({ success: true, message: `Role updated to ${role_name}.` });
  } catch (err) {
    logger.error('SUPER_ADMIN', 'changeRole failed', err);
    return res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ─── Delete any admin account ─────────────────────────────────────────────
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id).select('email role_name').lean();
    if (!target) return res.status(404).json({ success: false, error: 'User not found.' });

    // Cannot delete yourself
    if (String(target._id) === req.user?.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account.' });
    }

    await User.deleteOne({ _id: id });

    await logAuditEvent({
      eventType:    SecurityEventTypes.USER_DELETED,
      actorType:    'SUPER_ADMIN',
      req,
      resourceType: 'User',
      resourceId:   id,
      metadata:     { deleted_email: target.email, deleted_role: target.role_name, deleted_by: req.user?.email },
    });

    return res.json({ success: true, message: 'Admin account deleted.' });
  } catch (err) {
    logger.error('SUPER_ADMIN', 'deleteAdmin failed', err);
    return res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ─── Delete ALL stickers (nuclear, SUPER_ADMIN only) ─────────────────────
exports.deleteAllStickers = async (req, res) => {
  try {
    // Require explicit confirmation phrase in body
    const { confirm } = req.body || {};
    if (confirm !== 'DELETE_ALL_STICKERS') {
      return res.status(400).json({
        success: false,
        error: 'Send { "confirm": "DELETE_ALL_STICKERS" } to confirm this destructive action.',
      });
    }

    await QrModel.deleteAll();
    await logAuditEvent({
      eventType:    SecurityEventTypes.DATA_DELETED,
      actorType:    'SUPER_ADMIN',
      req,
      resourceType: 'Sticker',
      metadata:     { action: 'delete_all_stickers', actor: req.user?.email },
    });

    logger.security('SUPER_ADMIN_DELETE_ALL', `All stickers deleted by ${req.user?.email}`, { ip: req.ip });
    return res.json({ success: true, message: 'All stickers permanently deleted.' });
  } catch (err) {
    logger.error('SUPER_ADMIN', 'deleteAllStickers failed', err);
    return res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ─── Bulk delete selected stickers ───────────────────────────────────────
exports.bulkDeleteStickers = async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids[] is required.' });
    }

    const QrCode = require('../models/schemas/QrCode');
    const result = await QrCode.deleteMany({ _id: { $in: ids } });

    await logAuditEvent({
      eventType:    SecurityEventTypes.DATA_DELETED,
      actorType:    'SUPER_ADMIN',
      req,
      resourceType: 'Sticker',
      metadata:     { deleted_count: result.deletedCount, ids, actor: req.user?.email },
    });

    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    logger.error('SUPER_ADMIN', 'bulkDeleteStickers failed', err);
    return res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ─── Audit log viewer ─────────────────────────────────────────────────────
exports.getAuditLogs = async (req, res) => {
  try {
    const result = await queryAuditLogs({
      limit:        req.query.limit,
      page:         req.query.page,
      eventType:    req.query.eventType,
      actorType:    req.query.actorType,
      userId:       req.query.userId,
      ipAddress:    req.query.ip,
      resourceType: req.query.resource,
      startDate:    req.query.from,
      endDate:      req.query.to,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    logger.error('SUPER_ADMIN', 'getAuditLogs failed', err);
    return res.status(500).json({ success: false, error: 'Server error.' });
  }
};
