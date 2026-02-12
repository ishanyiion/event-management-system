const { query } = require('./config/db');

async function checkData() {
    try {
        const event6 = await query("SELECT id, organizer_id FROM events WHERE id = 6");
        const ishan = await query("SELECT id FROM users WHERE email = 'ishan@gmail.com'");

        console.log('--- DATA COMPARISON ---');
        if (event6.rows.length > 0) {
            console.log('EVENT_6_ORGANIZER_ID:', event6.rows[0].organizer_id);
        } else {
            console.log('EVENT_6_NOT_FOUND');
        }

        if (ishan.rows.length > 0) {
            console.log('ISHAN_USER_ID:', ishan.rows[0].id);
        } else {
            console.log('ISHAN_NOT_FOUND');
        }

    } catch (err) {
        console.error('Error checking data:', err);
    } finally {
        process.exit();
    }
}

checkData();
