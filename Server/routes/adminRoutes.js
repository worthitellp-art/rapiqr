const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Every route here requires a valid session AND the admin role — this is the
// support console (RepiQR staff only): user accounts, stickers, lost-access recovery.
router.use(verifyToken, verifyAdmin);

router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.post('/users/:id/reset-password', AdminController.triggerPasswordReset);
router.post('/users/:id/disable-2fa', AdminController.disableUserTwoFactor);
router.get('/stickers', AdminController.searchStickers);

module.exports = router;
