const express = require('express');
const router = express.Router();
const LogController = require('../controllers/logController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Live operational logs (ephemeral, 30-day hot retention)
router.get('/', verifyToken, verifyAdmin, LogController.getLogs);
router.delete('/', verifyToken, verifyAdmin, LogController.clearLogs);

// Compliance audit logs (CERT-In 180-day retention, append-only)
router.get('/audit', verifyToken, verifyAdmin, LogController.getAuditLogs);
router.delete('/audit', verifyToken, verifyAdmin, LogController.rejectAuditLogDeletion);

module.exports = router;
