const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/alertController');

router.post('/', AlertController.createAlert);
router.get('/', AlertController.getAlerts);

module.exports = router;
