const db = require('../config/db');

const createEvent = async (req, res) => {
    let { title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, category_id, category_name, packages, schedule, upi_id } = req.body;
    const organizer_id = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (start < today) {
        return res.status(400).json({ message: 'Event start date cannot be in the past.' });
    }

    if (end < start) {
        return res.status(400).json({ message: 'Event end date cannot be earlier than start date.' });
    }

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

        if (!upi_id) {
            return res.status(400).json({ message: 'UPI ID is compulsory for automated payments.' });
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
            'INSERT INTO events (organizer_id, category_id, title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, banner_url, images, upi_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
            [organizer_id, finalCategoryId, title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, banner_url, JSON.stringify(images), upi_id]
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
        const event = await db.query(
            `SELECT e.*, c.name as category_name, 
             u.name as organizer_name, u.email as organizer_email, u.mobile as organizer_mobile 
             FROM events e 
             LEFT JOIN categories c ON e.category_id = c.id 
             LEFT JOIN users u ON e.organizer_id = u.id
             WHERE e.id = $1`,
            [req.params.id]
        );
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
              WHERE bi.booking_id = b.id) as package_summary,
             (SELECT json_agg(json_build_object('package_name', p.package_name, 'qty', bi.qty, 'event_date', bi.event_date))
              FROM booking_items bi
              JOIN event_packages p ON bi.package_id = p.id
              WHERE bi.booking_id = b.id) as details
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

// --- Edit Flow: 1. Request Edit ---
const requestEditAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const organizer_id = req.user.id;

        // Check if event exists and belongs to organizer
        const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [id]);
        if (eventResult.rows.length === 0) return res.status(404).json({ message: 'Event not found' });
        const event = eventResult.rows[0];

        // Case-insensitive status check and type-agnostic ID check
        if (String(event.organizer_id) !== String(organizer_id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (event.status.toUpperCase() !== 'APPROVED') {
            return res.status(400).json({ message: 'Only approved/active events need edit permission.' });
        }

        await db.query("UPDATE events SET edit_permission = 'REQUESTED' WHERE id = $1", [id]);
        res.json({ message: 'Edit permission requested' });
    } catch (err) {
        console.error("requestEditAccess Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Edit Flow: 2. Admin Grants Access ---
const grantEditAccess = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("UPDATE events SET edit_permission = 'GRANTED' WHERE id = $1", [id]);
        res.json({ message: 'Edit access granted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Edit Flow: Admin List Requests ---
const getEditRequests = async (req, res) => {
    try {
        const requests = await db.query(`
            SELECT 
                e.*, 
                COALESCE(u.name, 'Unknown Organizer') as organizer_name 
            FROM events e 
            LEFT JOIN users u ON e.organizer_id = u.id 
            WHERE e.edit_permission IN ('REQUESTED', 'SUBMITTED') OR e.status = 'PENDING'
            ORDER BY e.created_at DESC
        `);
        res.json(requests.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Edit Flow: 4. Admin Approves Update ---
const approveUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const eventRes = await db.query('SELECT proposed_data FROM events WHERE id = $1', [id]);
        if (eventRes.rows.length === 0) return res.status(404).json({ message: 'Event not found' });

        const proposed = eventRes.rows[0].proposed_data;
        if (!proposed) return res.status(400).json({ message: 'No proposed changes found' });

        const { title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, category_id, upi_id, images, banner_url, packages, schedule } = proposed;

        // 1. Update main event table
        await db.query(
            `UPDATE events SET 
                title = COALESCE($1, title), 
                description = COALESCE($2, description), 
                location = COALESCE($3, location), 
                city = COALESCE($4, city), 
                start_date = COALESCE($5, start_date), 
                end_date = COALESCE($6, end_date), 
                start_time = COALESCE($7, start_time),
                end_time = COALESCE($8, end_time),
                max_capacity = COALESCE($9, max_capacity), 
                category_id = COALESCE($10, category_id),
                upi_id = COALESCE($11, upi_id),
                images = COALESCE($12, images),
                banner_url = COALESCE($13, banner_url),
                edit_permission = NULL,
                proposed_data = NULL
            WHERE id = $14`,
            [title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, category_id, upi_id, JSON.stringify(images), banner_url, id]
        );

        // 2. Update Packages
        if (packages) {
            await db.query('DELETE FROM event_packages WHERE event_id = $1', [id]);
            for (const pkg of packages) {
                await db.query('INSERT INTO event_packages (event_id, package_name, price, features, capacity) VALUES ($1, $2, $3, $4, $5)',
                    [id, pkg.name || pkg.package_name, pkg.price, pkg.features, pkg.capacity || 0]);
            }
        }

        // 3. Update Schedule
        if (schedule) {
            await db.query('DELETE FROM event_schedules WHERE event_id = $1', [id]);
            for (const item of schedule) {
                await db.query(
                    'INSERT INTO event_schedules (event_id, event_date, start_time, end_time, capacity) VALUES ($1, $2, $3, $4, $5)',
                    [id, item.date || item.event_date, item.startTime || item.start_time, item.endTime || item.end_time, item.capacity || max_capacity]
                );
            }
        }

        res.json({ message: 'Updates approved and applied to live event.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Edit Flow: 5. Admin Rejects Update ---
const rejectUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("UPDATE events SET edit_permission = 'GRANTED', proposed_data = NULL WHERE id = $1", [id]);
        res.json({ message: 'Update rejected. Organizer can resubmit.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Edit Flow: 3. Submit Update ---
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const organizer_id = req.user.id;

        let { title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, category_id, category_name, packages, schedule, upi_id } = req.body;

        const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [id]);
        if (eventRes.rows.length === 0) return res.status(404).json({ message: 'Event not found' });
        const event = eventRes.rows[0];

        // Authorization check
        if (req.user.role !== 'ADMIN' && String(event.organizer_id) !== String(organizer_id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // --- PROPOSED CHANGE LOGIC ---
        if (req.user.role === 'ORGANIZER' && event.status === 'APPROVED') {
            // No longer checking for GRANTED. Organizers can propose changes directly.
            if (event.edit_permission === 'SUBMITTED') {
                return res.status(403).json({ message: 'A change request is already pending review.' });
            }

            // Handle Images for proposed data
            let finalImages = event.images ? (typeof event.images === 'string' ? JSON.parse(event.images) : event.images) : [];
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(f => `/uploads/events/${f.filename}`);
                finalImages = [...finalImages, ...newImages].slice(0, 5);
            }
            const banner_url = finalImages.length > 0 ? finalImages[0] : null;

            if (typeof packages === 'string') packages = JSON.parse(packages);
            if (typeof schedule === 'string') schedule = JSON.parse(schedule);

            const proposed_data = {
                title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, category_id, upi_id,
                images: finalImages,
                banner_url,
                packages,
                schedule
            };

            await db.query(
                "UPDATE events SET proposed_data = $1, edit_permission = 'SUBMITTED' WHERE id = $2",
                [JSON.stringify(proposed_data), id]
            );

            return res.json({ message: 'Changes submitted for admin review. The live event remains unchanged.' });
        }

        // --- EXISTING LOGIC (For PENDING events or ADMIN edits) ---
        // Handle Images
        let finalImages = event.images ? (typeof event.images === 'string' ? JSON.parse(event.images) : event.images) : [];
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(f => `/uploads/events/${f.filename}`);
            finalImages = [...finalImages, ...newImages].slice(0, 5); // Keep max 5, append new ones
        }

        const banner_url = finalImages.length > 0 ? finalImages[0] : null;

        // Update Query
        // FORCE STATUS TO PENDING if Organizer updates it (and it's not already approved - handled above)
        let newStatus = event.status;
        let newEditPerm = event.edit_permission;

        if (req.user.role === 'ORGANIZER') {
            newStatus = 'PENDING';
            newEditPerm = null; // Reset permission
        }

        await db.query(
            `UPDATE events SET 
                title = COALESCE($1, title), 
                description = COALESCE($2, description), 
                location = COALESCE($3, location), 
                city = COALESCE($4, city), 
                start_date = COALESCE($5, start_date), 
                end_date = COALESCE($6, end_date), 
                max_capacity = COALESCE($7, max_capacity), 
                status = $8,
                edit_permission = $9,
                banner_url = $10,
                images = $11,
                upi_id = COALESCE($12, upi_id)
            WHERE id = $13`,
            [title, description, location, city, start_date, end_date, max_capacity, newStatus, newEditPerm, banner_url, JSON.stringify(finalImages), upi_id, id]
        );

        // Update Packages & Schedule - Full Replace for simplicity
        if (packages) {
            if (typeof packages === 'string') packages = JSON.parse(packages);
            await db.query('DELETE FROM event_packages WHERE event_id = $1', [id]);
            for (const pkg of packages) {
                await db.query('INSERT INTO event_packages (event_id, package_name, price, features, capacity) VALUES ($1, $2, $3, $4, $5)',
                    [id, pkg.name || pkg.package_name, pkg.price, pkg.features, pkg.capacity || 0]);
            }
        }

        if (schedule) {
            if (typeof schedule === 'string') schedule = JSON.parse(schedule);
            await db.query('DELETE FROM event_schedules WHERE event_id = $1', [id]);
            for (const item of schedule) {
                await db.query(
                    'INSERT INTO event_schedules (event_id, event_date, start_time, end_time, capacity) VALUES ($1, $2, $3, $4, $5)',
                    [id, item.date || item.event_date, item.startTime || item.start_time, item.endTime || item.end_time, item.capacity || max_capacity]
                );
            }
        }

        res.json({ message: req.user.role === 'ADMIN' ? 'Event updated successfully.' : 'Event updated successfully. It is now pending approval.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createEvent, getEvents, getEventById, approveEvent, deleteEvent, getCategories, getEventAnalytics, getOrganizerEvents, requestEditAccess, grantEditAccess, getEditRequests, updateEvent, approveUpdate, rejectUpdate };
