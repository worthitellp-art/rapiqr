const express = require('express');
const router = express.Router();
const HelplineController = require('../controllers/helplineController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Public: active helplines for the scan page (Ambulance, Towing, Mechanic, etc.)
router.get('/public', HelplineController.getPublic);

// Public: a provider applying via the landing page "Join us" form. Stored inactive
// until an admin approves it, so it can never be dialled before then.
router.post('/apply', HelplineController.apply);

// Admin-only: manage the helpline directory
router.get('/', verifyToken, verifyAdmin, HelplineController.getAll);
router.post('/', verifyToken, verifyAdmin, HelplineController.create);
router.patch('/:id', verifyToken, verifyAdmin, HelplineController.update);
router.delete('/:id', verifyToken, verifyAdmin, HelplineController.remove);

module.exports = router;
