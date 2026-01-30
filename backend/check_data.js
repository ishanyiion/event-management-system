const { query } = require('./config/db');

async function checkData() {
    try {
        console.log('--- EVENT ID 6 ---');
        const event6 = await query("SELECT * FROM events WHERE id = 6");
        console.log(JSON.stringify(event6.rows, null, 2));

        console.log('\n--- ALL EVENTS ---');
        const allEvents = await query("SELECT id, organizer_id, title, status FROM events");
        console.log(JSON.stringify(allEvents.rows, null, 2));

        console.log('\n--- ALL USERS ---');
        const allUsers = await query("SELECT id, name, email, role FROM users");
        console.log(JSON.stringify(allUsers.rows, null, 2));

    } catch (err) {
        console.error('Error checking data:', err);
    } finally {
        process.exit();
    }
}

checkData();
