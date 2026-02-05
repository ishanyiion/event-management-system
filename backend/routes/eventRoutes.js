const express = require('express');
const { createEvent, getEvents, getEventById, approveEvent, deleteEvent, getCategories, getEventAnalytics, getOrganizerEvents, requestEditAccess, grantEditAccess, getEditRequests, updateEvent, approveUpdate, rejectUpdate } = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

const upload = require('../middleware/upload');

router.get('/', getEvents);
router.get('/my', auth, authorize('ORGANIZER'), getOrganizerEvents);
router.get('/categories', getCategories);
router.get('/edit-requests', auth, authorize('ADMIN'), getEditRequests);
router.get('/:id', getEventById);
router.get('/analytics/:id', auth, authorize(['ADMIN', 'ORGANIZER']), getEventAnalytics);
router.post('/create', auth, authorize('ORGANIZER'), upload.array('images', 5), createEvent);
router.put('/update/:id', auth, authorize(['ORGANIZER', 'ADMIN']), upload.array('images', 5), updateEvent);
router.put('/request-edit/:id', auth, authorize('ORGANIZER'), requestEditAccess);
router.put('/grant-edit/:id', auth, authorize('ADMIN'), grantEditAccess);
router.put('/approve-update/:id', auth, authorize('ADMIN'), approveUpdate);
router.put('/reject-update/:id', auth, authorize('ADMIN'), rejectUpdate);
router.put('/approve/:id', auth, authorize(['ADMIN']), approveEvent);
router.delete('/:id', auth, authorize(['ADMIN', 'ORGANIZER']), deleteEvent);

module.exports = router;
