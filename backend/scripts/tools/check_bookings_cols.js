const { query } = require('./config/db');

async function checkColumns() {
    try {
        console.log('Checking columns for table bookings:');
        const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings'");
        res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    } catch (err) {
        console.error('Error checking columns:', err);
    } finally {
        process.exit();
    }
}

checkColumns();
