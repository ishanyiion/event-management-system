const express = require('express');
const { createEvent, getEvents, getEventById, approveEvent, deleteEvent, getCategories, getEventAnalytics, getOrganizerEvents } = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

const upload = require('../middleware/upload');

router.get('/', getEvents);
router.get('/my', auth, authorize('ORGANIZER'), getOrganizerEvents);
router.get('/categories', getCategories);
router.get('/:id', getEventById);
router.get('/analytics/:id', auth, authorize(['ADMIN', 'ORGANIZER']), getEventAnalytics);
router.post('/create', auth, authorize('ORGANIZER'), upload.array('images', 5), createEvent);
router.put('/approve/:id', auth, authorize(['ADMIN']), approveEvent);
router.delete('/:id', auth, authorize(['ADMIN', 'ORGANIZER']), deleteEvent);

module.exports = router;
