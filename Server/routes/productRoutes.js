const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/claim', ProductController.claimByCode);
router.get('/', ProductController.getMyProducts);
router.get('/:id', ProductController.getProductById);
router.get('/:id/history', ProductController.getHistory);
router.patch('/:id', ProductController.updateDetails);
router.patch('/:id/contacts', ProductController.updateContacts);
router.post('/:id/deactivate', ProductController.deactivate);
router.post('/:id/reactivate', ProductController.reactivate);
router.post('/:id/transfer', ProductController.transfer);
router.delete('/:id', ProductController.remove);

module.exports = router;
