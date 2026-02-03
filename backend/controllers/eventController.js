const db = require('../config/db');

const createEvent = async (req, res) => {
    let { title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, category_id, category_name, packages, schedule } = req.body;
    const organizer_id = req.user.id;

    try {
        // Handle JSON parsing for Multipart fields if they are strings
        if (typeof packages === 'string') packages = JSON.parse(packages);
        if (typeof schedule === 'string') schedule = JSON.parse(schedule);

        // Validate Package Capacities
        if (packages && packages.length > 0) {
            const hasZeroCapacity = packages.some(pkg => parseInt(pkg.capacity || 0) <= 0);
            if (hasZeroCapacity) {
                return res.status(400).json({ message: 'Each package must have at least 1 ticket.' });
            }

            const totalPackageCapacity = packages.reduce((sum, pkg) => sum + parseInt(pkg.capacity || 0), 0);
            if (totalPackageCapacity !== parseInt(max_capacity)) {
                return res.status(400).json({ message: `Total package capacity (${totalPackageCapacity}) must exactly match the event capacity (${max_capacity}).` });
            }
        } else {
            return res.status(400).json({ message: 'At least one event package is required.' });
        }

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
                    'INSERT INTO event_schedules (event_id, event_date, start_time, end_time, capacity) VALUES ($1, $2, $3, $4, $5)',
                    [eventId, item.date, item.startTime, item.endTime, item.capacity || max_capacity] // Default to global max if not set
                );
            }
        } else {
            // Fallback: create a single schedule entry
            await db.query(
                'INSERT INTO event_schedules (event_id, event_date, start_time, end_time, capacity) VALUES ($1, $2, $3, $4, $5)',
                [eventId, start_date, start_time, end_time, max_capacity]
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
        const { city, category, search, upcoming } = req.query;
        let query = 'SELECT e.*, c.name as category_name FROM events e LEFT JOIN categories c ON e.category_id = c.id WHERE e.status = \'APPROVED\'';
        const params = [];

        if (upcoming === 'true') {
            query += ' AND e.end_date >= CURRENT_DATE';
        }

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

        // Parse images JSON string for each event
        const parsedEvents = events.rows.map(event => ({
            ...event,
            images: typeof event.images === 'string' ? JSON.parse(event.images) : (event.images || [])
        }));

        res.json(parsedEvents);
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

        const packagesQuery = await db.query(
            `SELECT p.*, 
             COALESCE((SELECT SUM(bi.qty) FROM booking_items bi JOIN bookings b ON bi.booking_id = b.id WHERE bi.package_id = p.id AND b.booking_status = 'CONFIRMED'), 0) as total_sold
             FROM event_packages p WHERE p.event_id = $1`,
            [req.params.id]
        );

        const packages = packagesQuery.rows;

        // Fetch daily sold stats
        for (let pkg of packages) {
            const dailyRes = await db.query(
                `SELECT event_date, SUM(bi.qty) as sold
                 FROM booking_items bi
                 JOIN bookings b ON bi.booking_id = b.id
                 WHERE bi.package_id = $1 AND b.booking_status = 'CONFIRMED'
                 GROUP BY event_date`,
                [pkg.id]
            );

            const dailyMap = {};
            dailyRes.rows.forEach(r => {
                if (r.event_date) {
                    const dateKey = r.event_date.split('T')[0];
                    dailyMap[dateKey] = parseInt(r.sold || 0);
                }
            });
            pkg.daily_sold = dailyMap;
            pkg.sold_qty = pkg.total_sold; // keep for backward compatibility
        }

        const schedule = await db.query('SELECT * FROM event_schedules WHERE event_id = $1 ORDER BY event_date ASC', [req.params.id]);

        res.json({
            ...event.rows[0],
            images: typeof event.rows[0].images === 'string' ? JSON.parse(event.rows[0].images) : (event.rows[0].images || []),
            packages,
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

const getEventAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const organizer_id = req.user.id;

        // 1. Get Event Summary & Verify Organizer
        const eventRes = await db.query(
            `SELECT e.*, c.name as category_name 
             FROM events e 
             LEFT JOIN categories c ON e.category_id = c.id 
             WHERE e.id = $1`, [id]
        );

        if (eventRes.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const event = eventRes.rows[0];

        if (req.user.role !== 'ADMIN' && event.organizer_id !== organizer_id) {
            return res.status(403).json({ message: 'Not authorized to view analytics for this event' });
        }

        // 2. Category-wise Breakdown
        const packagesRes = await db.query(
            `SELECT p.*, 
             COALESCE((SELECT SUM(bi.qty) FROM booking_items bi JOIN bookings b ON bi.booking_id = b.id WHERE bi.package_id = p.id AND b.booking_status = 'CONFIRMED'), 0) as sold_qty,
             COALESCE((SELECT SUM(bi.qty * bi.price_at_time) FROM booking_items bi JOIN bookings b ON bi.booking_id = b.id WHERE bi.package_id = p.id AND b.booking_status = 'CONFIRMED'), 0) as category_revenue,
             (
                SELECT json_agg(json_build_object('date', ds.d, 'count', ds.c))
                FROM (
                    SELECT bi.event_date as d, SUM(bi.qty) as c
                    FROM booking_items bi 
                    JOIN bookings b ON bi.booking_id = b.id
                    WHERE bi.package_id = p.id AND b.booking_status = 'CONFIRMED'
                    GROUP BY bi.event_date
                ) ds
             ) as daily_breakdown
             FROM event_packages p WHERE p.event_id = $1`,
            [id]
        );

        // 4. Day-Wise Stats
        const dailyStatsRes = await db.query(
            `SELECT 
                es.event_date,
                es.capacity as daily_capacity,
                COALESCE(SUM(bi.qty), 0) as daily_sold,
                COALESCE(SUM(bi.qty * bi.price_at_time), 0) as daily_revenue
             FROM event_schedules es
             LEFT JOIN booking_items bi ON bi.event_date::DATE = es.event_date AND bi.booking_id IN (
                SELECT id FROM bookings WHERE event_id = $1 AND booking_status = 'CONFIRMED'
             )
             WHERE es.event_id = $1
             GROUP BY es.event_date, es.capacity
             ORDER BY es.event_date ASC`,
            [id]
        );

        // 3. Overall Stats (Now aggregated from daily stats)
        const stats = {
            totalCapacity: dailyStatsRes.rows.reduce((sum, row) => sum + parseInt(row.daily_capacity || 0), 0),
            totalSold: dailyStatsRes.rows.reduce((sum, row) => sum + parseInt(row.daily_sold || 0), 0),
            totalRevenue: dailyStatsRes.rows.reduce((sum, row) => sum + parseFloat(row.daily_revenue || 0), 0)
        };
        stats.remaining = Math.max(0, stats.totalCapacity - stats.totalSold);

        // 5. Bookings List
        const bookingsRes = await db.query(
            `SELECT b.id as booking_id, b.total_amount, b.booking_status, b.payment_status, b.created_at as booking_date, b.booked_date,
             u.name as person_name, u.email,
             (SELECT string_agg(p.package_name || ' (x' || bi.qty || ')', ', ') 
              FROM booking_items bi 
              JOIN event_packages p ON bi.package_id = p.id 
              WHERE bi.booking_id = b.id) as package_summary
             FROM bookings b
             JOIN users u ON b.client_id = u.id
             WHERE b.event_id = $1
             ORDER BY b.created_at DESC`,
            [id]
        );

        res.json({
            event,
            stats,
            packages: packagesRes.rows,
            dailyStats: dailyStatsRes.rows,
            bookings: bookingsRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrganizerEvents = async (req, res) => {
    try {
        const organizer_id = req.user.id;
        const events = await db.query(
            `SELECT e.*, c.name as category_name 
             FROM events e 
             LEFT JOIN categories c ON e.category_id = c.id 
             WHERE e.organizer_id = $1 
             ORDER BY e.created_at DESC`,
            [organizer_id]
        );

        // Parse images JSON string for each event
        const parsedEvents = events.rows.map(event => ({
            ...event,
            images: typeof event.images === 'string' ? JSON.parse(event.images) : (event.images || [])
        }));

        res.json(parsedEvents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createEvent, getEvents, getEventById, approveEvent, deleteEvent, getCategories, getEventAnalytics, getOrganizerEvents };
