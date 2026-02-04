const express = require('express');
const { getDashboardStats, getPendingOrganizers, verifyOrganizer, getPendingEvents, getApprovedEvents, getAllUsers, toggleUserStatus, getUserDetails, getUserEvents, getUserBookings } = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', auth, authorize('ADMIN'), getDashboardStats);
router.get('/organizers/pending', auth, authorize('ADMIN'), getPendingOrganizers);
router.put('/organizer/verify/:id', auth, authorize('ADMIN'), verifyOrganizer);
router.get('/events/pending', auth, authorize('ADMIN'), getPendingEvents);
router.get('/events/approved', auth, authorize('ADMIN'), getApprovedEvents);
router.get('/users', auth, authorize('ADMIN'), getAllUsers);
router.put('/users/status/:id', auth, authorize('ADMIN'), toggleUserStatus);
router.get('/users/:id', auth, authorize('ADMIN'), getUserDetails);
router.get('/users/:id/events', auth, authorize('ADMIN'), getUserEvents);
router.get('/users/:id/bookings', auth, authorize('ADMIN'), getUserBookings);

module.exports = router;
