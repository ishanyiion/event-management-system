const db = require('../config/db');

const createEvent = async (req, res) => {
    let { title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, category_id, category_name, packages, schedule } = req.body;
    const organizer_id = req.user.id;

    try {
        // Handle JSON parsing for Multipart fields if they are strings
        if (typeof packages === 'string') packages = JSON.parse(packages);
        if (typeof schedule === 'string') schedule = JSON.parse(schedule);

        // Check if organizer is verified
        const user = await db.query('SELECT status FROM users WHERE id = $1', [organizer_id]);
        if (user.rows[0].status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Organizer is not verified. Please contact admin.' });
        }

        // Handle Images
        const images = req.files ? req.files.map(f => `/uploads/events/${f.filename}`) : [];
        if (images.length === 0) {
            return res.status(400).json({ message: 'At least one event image is compulsory.' });
        }
        const banner_url = images.length > 0 ? images[0] : null;

        let finalCategoryId = category_id;

        // If category_name is provided (dynamic category), lookup or create
        if (category_name) {
            const catResult = await db.query('SELECT id FROM categories WHERE name ILIKE $1', [category_name]);
            if (catResult.rows.length > 0) {
                finalCategoryId = catResult.rows[0].id;
            } else {
                const newCat = await db.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [category_name]);
                finalCategoryId = newCat.rows[0].id;
            }
        }

        const newEvent = await db.query(
            'INSERT INTO events (organizer_id, category_id, title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, banner_url, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
            [organizer_id, finalCategoryId, title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, banner_url, JSON.stringify(images)]
        );

        const eventId = newEvent.rows[0].id;

        // Add schedules
        if (schedule && schedule.length > 0) {
            for (const item of schedule) {
                await db.query(
                    'INSERT INTO event_schedules (event_id, event_date, start_time, end_time) VALUES ($1, $2, $3, $4)',
                    [eventId, item.date, item.startTime, item.endTime]
                );
            }
        } else {
            // Fallback: create a single schedule entry
            await db.query(
                'INSERT INTO event_schedules (event_id, event_date, start_time, end_time) VALUES ($1, $2, $3, $4)',
                [eventId, start_date, start_time, end_time]
            );
        }

        // Add packages
        if (packages && packages.length > 0) {
            for (const pkg of packages) {
                await db.query(
                    'INSERT INTO event_packages (event_id, package_name, price, features, capacity) VALUES ($1, $2, $3, $4, $5)',
                    [eventId, pkg.name, pkg.price, pkg.features, pkg.capacity || 0]
                );
            }
        }

        res.status(201).json({ ...newEvent.rows[0], packages, schedule });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getEvents = async (req, res) => {
    try {
        const { city, category, search } = req.query;
        let query = 'SELECT e.*, c.name as category_name FROM events e LEFT JOIN categories c ON e.category_id = c.id WHERE e.status = \'APPROVED\'';
        const params = [];

        if (city) {
            params.push(`%${city}%`);
            query += ` AND e.city ILIKE $${params.length}`;
        }

        if (category) {
            params.push(category);
            query += ` AND c.name = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`;
        }

        const events = await db.query(query, params);
        res.json(events.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getEventById = async (req, res) => {
    try {
        const event = await db.query('SELECT e.*, c.name as category_name FROM events e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = $1', [req.params.id]);
        if (event.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const packages = await db.query(
            `SELECT p.*, 
             COALESCE((SELECT SUM(bi.qty) FROM booking_items bi JOIN bookings b ON bi.booking_id = b.id WHERE bi.package_id = p.id AND b.booking_status = 'CONFIRMED'), 0) as sold_qty
             FROM event_packages p WHERE p.event_id = $1`,
            [req.params.id]
        );
        const schedule = await db.query('SELECT * FROM event_schedules WHERE event_id = $1 ORDER BY event_date ASC', [req.params.id]);

        res.json({
            ...event.rows[0],
            packages: packages.rows,
            schedule: schedule.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const approveEvent = async (req, res) => {
    try {
        const updatedEvent = await db.query(
            'UPDATE events SET status = \'APPROVED\' WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        res.json(updatedEvent.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await db.query('SELECT organizer_id FROM events WHERE id = $1', [id]);

        if (event.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Authorization: Admin can delete any, Organizer can only delete their own
        if (req.user.role !== 'ADMIN' && event.rows[0].organizer_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await db.query('DELETE FROM events WHERE id = $1', [id]);
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCategories = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM categories WHERE name NOT ILIKE 'Birthday' AND name NOT ILIKE 'Wedding' ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createEvent, getEvents, getEventById, approveEvent, deleteEvent, getCategories };
