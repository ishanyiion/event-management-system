const db = require('../config/db');
const { sendReceipt } = require('../utils/emailService');

const createBooking = async (req, res) => {
    const { event_id, items, booked_date } = req.body; // items = [{ package_id, qty }], booked_date = array or string
    const client_id = req.user.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items selected for booking' });
    }

    const booked_dates = Array.isArray(booked_date) ? booked_date : [booked_date];

    try {
        await db.query('BEGIN');

        // 1. Get event details
        const eventRes = await db.query('SELECT max_capacity FROM events WHERE id = $1', [event_id]);
        if (eventRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Event not found' });
        }

        const totalRequestedQtyPerDay = items.reduce((sum, item) => sum + parseInt(item.qty), 0);
        const totalRequestedQtyAcrossAllDays = totalRequestedQtyPerDay * booked_dates.length;

        // 2. Check Capacity (Simplified: check total for each day or total overall)
        // User requested "select both day together", if max_capacity is 100, 
        // does it mean 100 for the whole event or 100 per day?
        // Assuming max_capacity is total for the event in this current schema.

        const confirmedBookings = await db.query(
            'SELECT SUM(qty) as total FROM bookings WHERE event_id = $1 AND booking_status = \'CONFIRMED\'',
            [event_id]
        );
        const currentQty = parseInt(confirmedBookings.rows[0].total || 0);

        if (currentQty + totalRequestedQtyAcrossAllDays > eventRes.rows[0].max_capacity) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Event is fully booked or requested quantity exceeds capacity.' });
        }

        // 3. Calculate Amount and Verify Packages
        let base_amount = 0;
        const itemsWithPrices = [];

        for (const item of items) {
            const pkgRes = await db.query('SELECT price, capacity, package_name FROM event_packages WHERE id = $1 AND event_id = $2', [item.package_id, event_id]);
            if (pkgRes.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ message: `Package ${item.package_id} not found for this event` });
            }

            const pkg = pkgRes.rows[0];
            const price = parseFloat(pkg.price);
            const packageCapacity = parseInt(pkg.capacity || 0);

            // Check specific package capacity if set (> 0)
            if (packageCapacity > 0) {
                const confirmedPkgBookings = await db.query(
                    `SELECT SUM(bi.qty) as total 
                     FROM booking_items bi 
                     JOIN bookings b ON bi.booking_id = b.id 
                     WHERE bi.package_id = $1 AND b.booking_status = 'CONFIRMED'`,
                    [item.package_id]
                );
                const currentPkgQty = parseInt(confirmedPkgBookings.rows[0].total || 0);
                const requestedPkgQtyAcrossAllDays = item.qty * booked_dates.length;

                if (currentPkgQty + requestedPkgQtyAcrossAllDays > packageCapacity) {
                    await db.query('ROLLBACK');
                    return res.status(400).json({
                        message: `The ${pkg.package_name} package is sold out or requested quantity exceeds its capacity (${packageCapacity - currentPkgQty} left).`
                    });
                }
            }

            base_amount += price * item.qty;
            itemsWithPrices.push({ ...item, price });
        }

        const total_amount = base_amount * booked_dates.length;

        // 4. Create Booking
        // Since booked_date is now an array, we store it as a comma separated string for now if the DB is DATE
        // Or we should update the DB to support arrays. 
        // To be safe and compatible with current DATE column, we'll store only the first date if it's strictly DATE
        // BUT the user wants to see BOTH. So let's use a migration to change it to TEXT or DATE[].

        const dateValue = booked_dates.join(','); // comma separated string for flexibility

        const newBooking = await db.query(
            'INSERT INTO bookings (event_id, client_id, total_amount, qty, booked_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [event_id, client_id, total_amount, totalRequestedQtyAcrossAllDays, dateValue]
        );
        const bookingId = newBooking.rows[0].id;

        // 5. Create Booking Items
        for (const item of itemsWithPrices) {
            await db.query(
                'INSERT INTO booking_items (booking_id, package_id, qty, price_at_time) VALUES ($1, $2, $3, $4)',
                [bookingId, item.package_id, item.qty * booked_dates.length, item.price]
            );
        }

        await db.query('COMMIT');
        res.status(201).json(newBooking.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const confirmPayment = async (req, res) => {
    const { booking_id, transaction_id, upi_app } = req.body;

    try {
        await db.query('BEGIN');
        const bookingRes = await db.query(
            'SELECT b.*, e.title as event_title, u.name as user_name, u.email as user_email FROM bookings b JOIN events e ON b.event_id = e.id JOIN users u ON b.client_id = u.id WHERE b.id = $1',
            [booking_id]
        );
        if (bookingRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Booking not found' });
        }

        const itemsRes = await db.query(
            'SELECT bi.*, p.package_name FROM booking_items bi JOIN event_packages p ON bi.package_id = p.id WHERE bi.booking_id = $1',
            [booking_id]
        );

        // Store Payment Record
        await db.query(
            'INSERT INTO payments (booking_id, amount, upi_app, transaction_id, status) VALUES ($1, $2, $3, $4, \'SUCCESS\')',
            [booking_id, bookingRes.rows[0].total_amount, upi_app, transaction_id]
        );

        // Update Booking Status
        const updatedBooking = await db.query(
            'UPDATE bookings SET booking_status = \'CONFIRMED\', payment_status = \'PAID\' WHERE id = $1 RETURNING *',
            [booking_id]
        );

        // Generate Unique Tickets
        for (const item of itemsRes.rows) {
            for (let i = 0; i < item.qty; i++) {
                const ticketNumber = `EH-${bookingRes.rows[0].event_id}-${booking_id}-${Math.floor(1000 + Math.random() * 9000)}-${i + 1}`;
                await db.query(
                    'INSERT INTO tickets (booking_id, package_id, ticket_number) VALUES ($1, $2, $3)',
                    [booking_id, item.package_id, ticketNumber]
                );
            }
        }

        await db.query('COMMIT');

        // Send Email Receipt
        const packageList = itemsRes.rows.map(item => `${item.package_name} (x${item.qty})`).join(', ');

        sendReceipt(bookingRes.rows[0].user_email || req.user.email, {
            id: booking_id,
            user_name: req.user.name,
            event_title: bookingRes.rows[0].event_title || 'Event',
            package_name: packageList,
            total_amount: bookingRes.rows[0].total_amount,
            transaction_id: transaction_id
        }).catch(err => console.error('Failed to send receipt email', err));

        res.json(updatedBooking.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Transaction ID already used.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const bookings = await db.query(
            `SELECT b.*, e.title as event_title, e.banner_url, c.name as category_name,
            (SELECT string_agg(p.package_name || ' (x' || bi.qty || ')', ', ') 
             FROM booking_items bi 
             JOIN event_packages p ON bi.package_id = p.id 
             WHERE bi.booking_id = b.id) as package_summary
            FROM bookings b 
            JOIN events e ON b.event_id = e.id 
            JOIN categories c ON e.category_id = c.id
            WHERE b.client_id = $1`,
            [req.user.id]
        );
        res.json(bookings.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const cancelBooking = async (req, res) => {
    const { id } = req.params;
    const client_id = req.user.id;

    try {
        const booking = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);

        if (booking.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.rows[0].client_id !== client_id) {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        if (booking.rows[0].booking_status !== 'PENDING') {
            return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
        }

        await db.query('DELETE FROM bookings WHERE id = $1', [id]);
        res.json({ message: 'Booking cancelled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const bookingRes = await db.query(
            'SELECT b.*, e.title as event_title, u.name as user_name, u.email as user_email FROM bookings b JOIN events e ON b.event_id = e.id JOIN users u ON b.client_id = u.id WHERE b.id = $1',
            [id]
        );

        if (bookingRes.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const booking = bookingRes.rows[0];

        // Authorization check
        if (req.user.role !== 'ADMIN' && String(booking.client_id) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const itemsRes = await db.query(
            'SELECT bi.*, p.package_name FROM booking_items bi JOIN event_packages p ON bi.package_id = p.id WHERE bi.booking_id = $1',
            [id]
        );
        booking.items = itemsRes.rows;

        const ticketsRes = await db.query(
            'SELECT t.*, p.package_name FROM tickets t JOIN event_packages p ON t.package_id = p.id WHERE t.booking_id = $1',
            [id]
        );
        booking.tickets = ticketsRes.rows;

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createBooking, confirmPayment, getMyBookings, cancelBooking, getBookingById };
