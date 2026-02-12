const { query } = require('./config/db');

async function checkData() {
    try {
        const event6 = await query("SELECT id, organizer_id, title FROM events WHERE id = 6");
        if (event6.rows.length > 0) {
            console.log('EVENT_ID_6_FOUND');
            console.log('ORGANIZER_ID:', event6.rows[0].organizer_id);
        } else {
            console.log('EVENT_ID_6_NOT_FOUND');
        }

        const ishan = await query("SELECT id FROM users WHERE email = 'ishan@gmail.com'");
        if (ishan.rows.length > 0) {
            console.log('ISHAN_ID:', ishan.rows[0].id);
        }

    } catch (err) {
        console.error('Error checking data:', err);
    } finally {
        process.exit();
    }
}

checkData();
