const { query } = require('./config/db');

async function checkDashboardData() {
    try {
        const res = await query('SELECT b.id, b.booked_date, e.title FROM bookings b JOIN events e ON b.event_id = e.id WHERE e.id = 7');
        console.log('BOOKINGS_EVENT_7:', JSON.stringify(res.rows));

        const event = await query('SELECT id, start_date, end_date FROM events WHERE id = 7');
        console.log('EVENT_7_DATES:', JSON.stringify(event.rows));

        const schedule = await query('SELECT event_date FROM event_schedules WHERE event_id = 7');
        console.log('SCHEDULE_7:', JSON.stringify(schedule.rows));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkDashboardData();
