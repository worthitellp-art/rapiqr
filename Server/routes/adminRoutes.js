const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const PrivacyController = require('../controllers/privacyController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Every route here requires a valid session AND the admin role — this is the
// support console (RepiQR staff only): user accounts, stickers, lost-access recovery.
router.use(verifyToken, verifyAdmin);

router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.get('/users/:id/activity', AdminController.getUserActivity);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/:id/reset-password', AdminController.triggerPasswordReset);
router.post('/users/:id/disable-2fa', AdminController.disableUserTwoFactor);
router.get('/stickers', AdminController.searchStickers);
router.post('/stickers/reveal-recovery-codes', AdminController.revealRecoveryCodes);
router.get('/messages/stats', AdminController.getMessageStats);
router.get('/messages', AdminController.listMessages);
router.delete('/messages', AdminController.deleteAllMessages);
router.get('/sticker-position', AdminController.getStickerPosition);
router.put('/sticker-position', AdminController.saveStickerPosition);

router.get('/privacy/grievances', PrivacyController.adminListGrievances);
router.patch('/privacy/grievances/:id', PrivacyController.adminUpdateGrievance);

module.exports = router;
