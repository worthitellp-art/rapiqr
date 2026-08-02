const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');

router.post('/activation-confirmation', NotificationController.sendActivationConfirmation);

module.exports = router;
