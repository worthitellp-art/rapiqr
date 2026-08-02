const express = require('express');
const router = express.Router();
const LogController = require('../controllers/logController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, verifyAdmin, LogController.getLogs);
router.delete('/', verifyToken, verifyAdmin, LogController.clearLogs);

module.exports = router;
