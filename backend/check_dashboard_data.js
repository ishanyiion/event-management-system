const { query } = require('./config/db');

async function checkBookings() {
    try {
        console.log('--- ALL BOOKINGS ---');
        const res = await query(`
            SELECT b.id, b.event_id, b.booked_date, b.payment_status, e.title 
            FROM bookings b 
            JOIN events e ON b.event_id = e.id 
            ORDER BY b.id DESC
        `);
        console.log('Bookings:', JSON.stringify(res.rows, null, 2));

        console.log('\n--- EVENT 7 INFO ---');
        const eventRes = await query("SELECT id, title, start_date, end_date FROM events WHERE id = 7");
        console.log('Event 7:', JSON.stringify(eventRes.rows, null, 2));

        const scheduleRes = await query("SELECT * FROM event_schedules WHERE event_id = 7");
        console.log('Schedule 7:', JSON.stringify(scheduleRes.rows, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkBookings();
