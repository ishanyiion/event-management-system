const db = require('../config/db');
const { sendReceipt } = require('../utils/emailService');

const createBooking = async (req, res) => {
    const { event_id, items, booked_date } = req.body;
    // New items format expected from frontend: 
    // items = [{ package_id, qty, date }] 
    // OR legacy format: items = [{ package_id, qty }], booked_date = [date1, date2]

    const client_id = req.user.id;

    if (!items || items.length === 0) {
        // If legacy format is sent with empty items but valid logic (unlikely)
        return res.status(400).json({ message: 'No items selected for booking' });
    }

    try {
        await db.query('BEGIN');

        // 1. Get event details
        const eventRes = await db.query('SELECT max_capacity, end_date, organizer_id FROM events WHERE id = $1', [event_id]);
        if (eventRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Event not found' });
        }

        const event = eventRes.rows[0];

        // 1.1 Ownership Check: Organizers cannot book their own event
        if (req.user.role === 'ORGANIZER' && String(event.organizer_id) === String(req.user.id)) {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: 'Organizers cannot book tickets for their own events.' });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const eventEndDate = new Date(event.end_date);
        eventEndDate.setHours(0, 0, 0, 0);

        if (eventEndDate < today) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'This event has already ended and is no longer accepting bookings.' });
        }

        // Normalize items to day-wise format
        let flattenedItems = [];
        let datesSet = new Set();

        // Check if using legacy format (booked_date global array + non-dated items)
        if (booked_date && Array.isArray(booked_date) && booked_date.length > 0 && !items[0].date) {
            // Legacy/Global mode: Apply all items to all dates
            for (const date of booked_date) {
                datesSet.add(date);
                for (const item of items) {
                    if (item.qty > 0) {
                        flattenedItems.push({
                            package_id: item.package_id,
                            qty: parseInt(item.qty),
                            date: date
                        });
                    }
                }
            }
        } else {
            // New Day-Wise mode: Items already contain date
            for (const item of items) {
                if (item.qty > 0) {
                    const itemDate = new Date(item.date);
                    itemDate.setHours(0, 0, 0, 0);

                    if (itemDate < today) {
                        await db.query('ROLLBACK');
                        return res.status(400).json({ message: `Cannot book for a past date: ${item.date}` });
                    }

                    flattenedItems.push({
                        package_id: item.package_id,
                        qty: parseInt(item.qty),
                        date: item.date // Expecting 'YYYY-MM-DD'
                    });
                    if (item.date) datesSet.add(item.date);
                }
            }
        }

        if (flattenedItems.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'No items with quantity > 0 selected.' });
        }

        const bookedDatesArray = Array.from(datesSet);
        const totalRequestedQty = flattenedItems.reduce((sum, item) => sum + item.qty, 0);

        // 3. Calculate Amount and Verify Package Capacities
        let total_amount = 0;
        const itemsWithDetails = [];

        for (const item of flattenedItems) {
            const pkgRes = await db.query('SELECT price, capacity, package_name FROM event_packages WHERE id = $1 AND event_id = $2', [item.package_id, event_id]);
            if (pkgRes.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ message: `Package ${item.package_id} not found` });
            }

            const pkg = pkgRes.rows[0];
            const price = parseFloat(pkg.price);
            const packageCapacity = parseInt(pkg.capacity || 0);

            // 3.1 Verify Package Capacity
            if (packageCapacity > 0) {
                let confirmedPkgBookings;

                if (item.date) {
                    // Check capacity for this specific day
                    confirmedPkgBookings = await db.query(
                        `SELECT SUM(bi.qty) as total 
                          FROM booking_items bi 
                          JOIN bookings b ON bi.booking_id = b.id 
                          WHERE bi.package_id = $1 
                          AND bi.event_date = $2
                          AND b.booking_status = 'CONFIRMED'`,
                        [item.package_id, item.date]
                    );

                    const currentPkgQty = parseInt(confirmedPkgBookings.rows[0].total || 0);
                    const currentCartPkgQty = flattenedItems
                        .filter(i => i.package_id === item.package_id && i.date === item.date)
                        .reduce((s, i) => s + i.qty, 0);

                    if (currentPkgQty + currentCartPkgQty > packageCapacity) {
                        await db.query('ROLLBACK');
                        return res.status(400).json({
                            message: `The ${pkg.package_name} package is sold out for ${new Date(item.date).toLocaleDateString()}.`
                        });
                    }

                } else {
                    // Legacy Global Check
                    confirmedPkgBookings = await db.query(
                        `SELECT SUM(bi.qty) as total 
                          FROM booking_items bi 
                          JOIN bookings b ON bi.booking_id = b.id 
                          WHERE bi.package_id = $1 AND b.booking_status = 'CONFIRMED'`,
                        [item.package_id]
                    );

                    const currentPkgQty = parseInt(confirmedPkgBookings.rows[0].total || 0);
                    const currentCartPkgQty = flattenedItems
                        .filter(i => i.package_id === item.package_id)
                        .reduce((s, i) => s + i.qty, 0);

                    if (currentPkgQty + currentCartPkgQty > packageCapacity) {
                        await db.query('ROLLBACK');
                        return res.status(400).json({
                            message: `The ${pkg.package_name} package is sold out or requested quantity exceeds its capacity.`
                        });
                    }
                }
            }

            // Day-wise Capacity Check
            if (item.date) {
                // Determine capacity for this day: 
                // Priority: 1. Specific day capacity from event_schedules 
                //           2. Global event max_capacity
                const dayCapRes = await db.query(
                    'SELECT capacity FROM event_schedules WHERE event_id = $1 AND event_date = $2',
                    [event_id, item.date]
                );

                let dayCapacity = eventRes.rows[0].max_capacity; // Fallback to global
                if (dayCapRes.rows.length > 0 && dayCapRes.rows[0].capacity > 0) {
                    dayCapacity = dayCapRes.rows[0].capacity;
                }

                const daySoldRes = await db.query(
                    `SELECT SUM(bi.qty) as total FROM booking_items bi 
                    JOIN bookings b ON bi.booking_id = b.id 
                    WHERE b.event_id = $1 AND bi.event_date = $2 AND b.booking_status = 'CONFIRMED'`,
                    [event_id, item.date]
                );

                const currentDaySold = parseInt(daySoldRes.rows[0].total || 0);

                // Count quantity for THIS day in current cart request
                const cartDayQty = flattenedItems
                    .filter(i => i.date === item.date)
                    .reduce((s, i) => s + i.qty, 0);

                if (currentDaySold + cartDayQty > dayCapacity) {
                    await db.query('ROLLBACK');
                    return res.status(400).json({
                        message: `Tickets for ${new Date(item.date).toLocaleDateString()} are sold out (Capacity: ${dayCapacity}).`
                    });
                }
            }

            total_amount += price * item.qty;
            itemsWithDetails.push({ ...item, price });
        }

        // 4. Create Booking
        // store dates as comma string for high-level view
        const dateValue = bookedDatesArray.join(',');

        const newBooking = await db.query(
            'INSERT INTO bookings (event_id, client_id, total_amount, qty, booked_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [event_id, client_id, total_amount, totalRequestedQty, dateValue]
        );
        const bookingId = newBooking.rows[0].id;

        // 5. Create Booking Items with Dates
        for (const item of itemsWithDetails) {
            await db.query(
                'INSERT INTO booking_items (booking_id, package_id, qty, price_at_time, event_date) VALUES ($1, $2, $3, $4, $5)',
                [bookingId, item.package_id, item.qty, item.price, item.date]
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
            'SELECT b.*, e.title as event_title, e.upi_id as organizer_upi_id, u.name as user_name, u.email as user_email, org.name as organizer_name FROM bookings b JOIN events e ON b.event_id = e.id JOIN users u ON b.client_id = u.id JOIN users org ON e.organizer_id = org.id WHERE b.id = $1',
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
                    'INSERT INTO tickets (booking_id, package_id, ticket_number, event_date) VALUES ($1, $2, $3, $4)',
                    [booking_id, item.package_id, ticketNumber, item.event_date]
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
            WHERE b.client_id = $1
            ORDER BY b.created_at DESC`,
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

        if (booking.rows[0].booking_status !== 'PENDING' && booking.rows[0].payment_status !== 'UNPAID') {
            return res.status(400).json({ message: 'Only pending or unpaid bookings can be removed' });
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
            'SELECT b.*, e.title as event_title, e.upi_id as organizer_upi_id, u.name as user_name, u.email as user_email, org.name as organizer_name FROM bookings b JOIN events e ON b.event_id = e.id JOIN users u ON b.client_id = u.id JOIN users org ON e.organizer_id = org.id WHERE b.id = $1',
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

        // Generating/Fetching Unique Tickets
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
