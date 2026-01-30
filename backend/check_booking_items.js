const { query } = require('./config/db');

async function checkTable() {
    try {
        const res = await query("SELECT table_name FROM information_schema.tables WHERE table_name = 'booking_items'");
        if (res.rows.length > 0) {
            console.log('TABLE_BOOKING_ITEMS_EXISTS');
        } else {
            console.log('TABLE_BOOKING_ITEMS_MISSING');
        }
    } catch (err) {
        console.error('Error checking table:', err);
    } finally {
        process.exit();
    }
}

checkTable();
