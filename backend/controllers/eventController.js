const db = require('../config/db');

const createEvent = async (req, res) => {
    const { title, description, location, city, start_date, end_date, max_capacity, category_id, category_name, banner_url, packages } = req.body;
    const organizer_id = req.user.id;

    try {
        // Check if organizer is verified (optional based on requirements)
        const user = await db.query('SELECT status FROM users WHERE id = $1', [organizer_id]);
        if (user.rows[0].status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Organizer is not verified. Please contact admin.' });
        }

        let finalCategoryId = category_id;

        // If category_name is provided, lookup or create
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
            'INSERT INTO events (organizer_id, category_id, title, description, location, city, start_date, end_date, max_capacity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [organizer_id, finalCategoryId, title, description, location, city, start_date, end_date, max_capacity]
        );

        const eventId = newEvent.rows[0].id;

        // Add packages
        if (packages && packages.length > 0) {
            for (const pkg of packages) {
                await db.query(
                    'INSERT INTO event_packages (event_id, package_name, price, features) VALUES ($1, $2, $3, $4)',
                    [eventId, pkg.name, pkg.price, pkg.features]
                );
            }
        }

        res.status(201).json({ ...newEvent.rows[0], packages });
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

        const packages = await db.query('SELECT * FROM event_packages WHERE event_id = $1', [req.params.id]);

        res.json({ ...event.rows[0], packages: packages.rows });
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
        const result = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createEvent, getEvents, getEventById, approveEvent, deleteEvent, getCategories };
