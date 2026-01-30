const { query } = require('./config/db');

async function debugConfirmPayment() {
    const booking_id = 6;
    const transaction_id = 'DEBUG_TXN_' + Date.now();
    const upi_app = 'PhonePe';

    try {
        console.log('--- STARTING TRANSACTION ---');
        await query('BEGIN');

        const bookingRes = await query(
            'SELECT b.*, e.title as event_title, u.name as user_name, u.email as user_email FROM bookings b JOIN events e ON b.event_id = e.id JOIN users u ON b.client_id = u.id WHERE b.id = $1',
            [booking_id]
        );

        if (bookingRes.rows.length === 0) {
            console.log('Booking not found');
            await query('ROLLBACK');
            return;
        }

        console.log('Booking Found:', bookingRes.rows[0].id);

        const itemsRes = await query(
            'SELECT bi.*, p.package_name FROM booking_items bi JOIN event_packages p ON bi.package_id = p.id WHERE bi.booking_id = $1',
            [booking_id]
        );
        console.log('Items Count:', itemsRes.rows.length);

        console.log('Inserting Payment...');
        await query(
            'INSERT INTO payments (booking_id, amount, upi_app, transaction_id, status) VALUES ($1, $2, $3, $4, \'SUCCESS\')',
            [booking_id, bookingRes.rows[0].total_amount, upi_app, transaction_id]
        );
        console.log('Payment Inserted.');

        console.log('Updating Booking...');
        await query(
            'UPDATE bookings SET booking_status = \'CONFIRMED\', payment_status = \'PAID\' WHERE id = $1',
            [booking_id]
        );
        console.log('Booking Updated.');

        console.log('Generating Tickets...');
        for (const item of itemsRes.rows) {
            for (let i = 0; i < item.qty; i++) {
                const ticketNumber = `EH-${bookingRes.rows[0].event_id}-${booking_id}-${Math.floor(1000 + Math.random() * 9000)}-${i + 1}`;
                await query(
                    'INSERT INTO tickets (booking_id, package_id, ticket_number) VALUES ($1, $2, $3)',
                    [booking_id, item.package_id, ticketNumber]
                );
            }
        }
        console.log('Tickets Generated.');

        await query('COMMIT');
        console.log('TRANSACTION COMMITTED.');

    } catch (err) {
        await query('ROLLBACK');
        console.error('--- ERROR DETECTED ---');
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        console.error('Detail:', err.detail);
        console.error('Stack:', err.stack);
    } finally {
        process.exit();
    }
}

debugConfirmPayment();
