const express = require('express');
const { createBooking, confirmPayment, getMyBookings, cancelBooking, getBookingById } = require('../controllers/bookingController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, authorize('CLIENT'), createBooking);
router.post('/confirm-payment', auth, authorize('CLIENT'), confirmPayment);
router.get('/my', auth, authorize('CLIENT'), getMyBookings);
router.get('/:id', auth, getBookingById);
router.delete('/:id', auth, authorize('CLIENT'), cancelBooking);

module.exports = router;
