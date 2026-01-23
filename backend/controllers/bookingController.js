const db = require('../config/db');

const createBooking = async (req, res) => {
    const { event_id, package_id, qty } = req.body;
    const client_id = req.user.id;

    try {
        // 1. Get event and package details
        const event = await db.query('SELECT max_capacity FROM events WHERE id = $1', [event_id]);
        const pkg = await db.query('SELECT price FROM event_packages WHERE id = $1', [package_id]);

        if (event.rows.length === 0 || pkg.rows.length === 0) {
            return res.status(404).json({ message: 'Event or package not found' });
        }

        // 2. Check Capacity
        const confirmedBookings = await db.query(
            'SELECT SUM(qty) as total FROM bookings WHERE event_id = $1 AND booking_status = \'CONFIRMED\'',
            [event_id]
        );
        const currentQty = parseInt(confirmedBookings.rows[0].total || 0);

        if (currentQty + parseInt(qty) > event.rows[0].max_capacity) {
            return res.status(400).json({ message: 'Event is fully booked or requested quantity exceeds capacity.' });
        }

        // 3. Calculate Amount
        const total_amount = pkg.rows[0].price * qty;

        // 4. Create Booking (PENDING / UNPAID)
        const newBooking = await db.query(
            'INSERT INTO bookings (event_id, client_id, package_id, qty, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [event_id, client_id, package_id, qty, total_amount]
        );

        res.status(201).json(newBooking.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const confirmPayment = async (req, res) => {
    const { booking_id, transaction_id, upi_app } = req.body;

    try {
        const booking = await db.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
        if (booking.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Store Payment Record
        await db.query(
            'INSERT INTO payments (booking_id, amount, upi_app, transaction_id, status) VALUES ($1, $2, $3, $4, \'SUCCESS\')',
            [booking_id, booking.rows[0].total_amount, upi_app, transaction_id]
        );

        // Update Booking Status
        const updatedBooking = await db.query(
            'UPDATE bookings SET booking_status = \'CONFIRMED\', payment_status = \'PAID\' WHERE id = $1 RETURNING *',
            [booking_id]
        );

        res.json(updatedBooking.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique constraint violation for transaction_id
            return res.status(400).json({ message: 'Transaction ID already used.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const bookings = await db.query(
            'SELECT b.*, e.title as event_title, p.package_name FROM bookings b JOIN events e ON b.event_id = e.id JOIN event_packages p ON b.package_id = p.id WHERE b.client_id = $1',
            [req.user.id]
        );
        res.json(bookings.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createBooking, confirmPayment, getMyBookings };
