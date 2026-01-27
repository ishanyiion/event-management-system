const express = require('express');
const { createEvent, getEvents, getEventById, approveEvent, deleteEvent, getCategories } = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', getEvents);
router.get('/categories', getCategories);
router.get('/:id', getEventById);
router.post('/create', auth, authorize('ORGANIZER'), createEvent);
router.put('/approve/:id', auth, authorize(['ADMIN']), approveEvent);
router.delete('/:id', auth, authorize(['ADMIN', 'ORGANIZER']), deleteEvent);

module.exports = router;
