const db = require('../config/db');
const { sendReceipt } = require('../utils/emailService');

const createBooking = async (req, res) => {
    const { event_id, items } = req.body; // items = [{ package_id, qty }]
    const client_id = req.user.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items selected for booking' });
    }

    try {
        await db.query('BEGIN');

        // 1. Get event details
        const eventRes = await db.query('SELECT max_capacity FROM events WHERE id = $1', [event_id]);
        if (eventRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Event not found' });
        }

        const totalRequestedQty = items.reduce((sum, item) => sum + parseInt(item.qty), 0);

        // 2. Check Capacity
        const confirmedBookings = await db.query(
            'SELECT SUM(qty) as total FROM bookings WHERE event_id = $1 AND booking_status = \'CONFIRMED\'',
            [event_id]
        );
        const currentQty = parseInt(confirmedBookings.rows[0].total || 0);

        if (currentQty + totalRequestedQty > eventRes.rows[0].max_capacity) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Event is fully booked or requested quantity exceeds capacity.' });
        }

        // 3. Calculate Amount and Verify Packages
        let total_amount = 0;
        const itemsWithPrices = [];

        for (const item of items) {
            const pkgRes = await db.query('SELECT price FROM event_packages WHERE id = $1 AND event_id = $2', [item.package_id, event_id]);
            if (pkgRes.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ message: `Package ${item.package_id} not found for this event` });
            }
            const price = parseFloat(pkgRes.rows[0].price);
            total_amount += price * item.qty;
            itemsWithPrices.push({ ...item, price });
        }

        // 4. Create Booking
        const newBooking = await db.query(
            'INSERT INTO bookings (event_id, client_id, total_amount, qty) VALUES ($1, $2, $3, $4) RETURNING *',
            [event_id, client_id, total_amount, totalRequestedQty]
        );
        const bookingId = newBooking.rows[0].id;

        // 5. Create Booking Items
        for (const item of itemsWithPrices) {
            await db.query(
                'INSERT INTO booking_items (booking_id, package_id, qty, price_at_time) VALUES ($1, $2, $3, $4)',
                [bookingId, item.package_id, item.qty, item.price]
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
            `SELECT b.*, e.title as event_title, 
            (SELECT string_agg(p.package_name || ' (x' || bi.qty || ')', ', ') 
             FROM booking_items bi 
             JOIN event_packages p ON bi.package_id = p.id 
             WHERE bi.booking_id = b.id) as package_summary
            FROM bookings b 
            JOIN events e ON b.event_id = e.id 
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

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createBooking, confirmPayment, getMyBookings, cancelBooking, getBookingById };
