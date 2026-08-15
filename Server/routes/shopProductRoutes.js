const express = require('express');
const router = express.Router();
const ShopProductController = require('../controllers/shopProductController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', ShopProductController.listPublic);
router.get('/admin', verifyToken, verifyAdmin, ShopProductController.listAdmin);
router.post('/', verifyToken, verifyAdmin, ShopProductController.create);
router.patch('/:id', verifyToken, verifyAdmin, ShopProductController.update);
router.delete('/:id', verifyToken, verifyAdmin, ShopProductController.remove);

module.exports = router;
