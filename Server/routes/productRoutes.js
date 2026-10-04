const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

// Ownership (not a guessable secret) is the access control on recover, but
// this still caps how hard a compromised/malicious session can hammer it.
const recoverLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many recovery attempts, please try again later.' });

router.use(verifyToken);

router.get('/', ProductController.getMyProducts);
// Static path — must stay above '/:id' or "history" would be read as a sticker id.
router.get('/history', ProductController.getAllHistory);
router.get('/:id', ProductController.getProductById);
router.get('/:id/history', ProductController.getHistory);
router.patch('/:id', ProductController.updateDetails);
router.patch('/:id/contacts', ProductController.updateContacts);
router.post('/:id/deactivate', ProductController.deactivate);
router.post('/:id/reactivate', ProductController.reactivate);
router.post('/:id/transfer', ProductController.transfer);
router.post('/:id/recover', recoverLimiter, ProductController.recover);
router.delete('/:id', ProductController.remove);

module.exports = router;
