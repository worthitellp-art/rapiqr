const express = require('express');
const router = express.Router();
const DistributorController = require('../controllers/distributorController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', verifyToken, DistributorController.apply);
router.get('/me', verifyToken, DistributorController.myStatus);
router.get('/', verifyToken, verifyAdmin, DistributorController.list);
router.patch('/:id/status', verifyToken, verifyAdmin, DistributorController.updateStatus);

module.exports = router;
