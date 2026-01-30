const { query } = require('./config/db');

async function checkEvent7() {
    try {
        console.log('--- DATA FOR EVENT 7 ---');
        const event = await query("SELECT * FROM events WHERE id = 7");
        console.log('Event Info:', JSON.stringify(event.rows, null, 2));

        const packages = await query("SELECT * FROM event_packages WHERE event_id = 7");
        console.log('Packages Info:', JSON.stringify(packages.rows, null, 2));

        const schedules = await query("SELECT * FROM event_schedules WHERE event_id = 7");
        console.log('Schedules Info:', JSON.stringify(schedules.rows, null, 2));

    } catch (err) {
        console.error('Error checking event 7:', err);
    } finally {
        process.exit();
    }
}

checkEvent7();
