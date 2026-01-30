const { query } = require('./config/db');

async function checkBooking6() {
    try {
        console.log('--- CHECKING BOOKING 6 ---');
        const booking = await query("SELECT * FROM bookings WHERE id = 6");
        console.log('Booking:', JSON.stringify(booking.rows, null, 2));

        const items = await query("SELECT * FROM booking_items WHERE booking_id = 6");
        console.log('Booking Items:', JSON.stringify(items.rows, null, 2));

        const event = await query("SELECT * FROM events WHERE id = (SELECT event_id FROM bookings WHERE id = 6)");
        console.log('Event Info:', JSON.stringify(event.rows, null, 2));

        console.log('\n--- CHECKING PAYMENTS TABLE ---');
        const tableInfo = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'");
        console.log('Payments Columns:', JSON.stringify(tableInfo.rows, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkBooking6();
