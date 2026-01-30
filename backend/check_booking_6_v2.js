const { query } = require('./config/db');

async function checkBooking6() {
    try {
        const booking = await query("SELECT id, event_id, client_id, total_amount FROM bookings WHERE id = 6");
        console.log('BOOKING_6:', JSON.stringify(booking.rows[0]));

        const items = await query("SELECT id, package_id, qty FROM booking_items WHERE booking_id = 6");
        console.log('ITEMS_6_COUNT:', items.rows.length);

        const paymentsCols = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'");
        console.log('PAYMENTS_COLS:', JSON.stringify(paymentsCols.rows.map(c => c.column_name)));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkBooking6();
