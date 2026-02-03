const express = require('express');
const { createBooking, confirmPayment, getMyBookings, cancelBooking, getBookingById } = require('../controllers/bookingController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, authorize(['CLIENT', 'ADMIN', 'ORGANIZER']), createBooking);
router.post('/confirm-payment', auth, authorize(['CLIENT', 'ADMIN', 'ORGANIZER']), confirmPayment);
router.get('/my', auth, authorize(['CLIENT', 'ADMIN', 'ORGANIZER']), getMyBookings);
router.get('/:id', auth, getBookingById);
router.delete('/:id', auth, authorize(['CLIENT', 'ADMIN', 'ORGANIZER']), cancelBooking);

module.exports = router;
