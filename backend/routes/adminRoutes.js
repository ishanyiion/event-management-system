const express = require('express');
const { getDashboardStats, getPendingOrganizers, verifyOrganizer, getPendingEvents } = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', auth, authorize('ADMIN'), getDashboardStats);
router.get('/organizers/pending', auth, authorize('ADMIN'), getPendingOrganizers);
router.put('/organizer/verify/:id', auth, authorize('ADMIN'), verifyOrganizer);
router.get('/events/pending', auth, authorize('ADMIN'), getPendingEvents);

module.exports = router;
