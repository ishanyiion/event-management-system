const express = require('express');
const { createEvent, getEvents, getEventById, approveEvent } = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/create', auth, authorize('ORGANIZER'), createEvent);
router.put('/approve/:id', auth, authorize('ADMIN'), approveEvent);

module.exports = router;
