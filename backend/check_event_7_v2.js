const { query } = require('./config/db');

async function checkEvent7() {
    try {
        const event = await query("SELECT id, title, banner_url, images, status FROM events WHERE id = 7");
        console.log('EVENT_7:', JSON.stringify(event.rows[0]));

        const packages = await query("SELECT id, package_name, price, features, capacity FROM event_packages WHERE event_id = 7");
        console.log('PACKAGES_7:', JSON.stringify(packages.rows));

        const schedules = await query("SELECT id, event_date, start_time, end_time FROM event_schedules WHERE event_id = 7");
        console.log('SCHEDULES_7:', JSON.stringify(schedules.rows));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkEvent7();
