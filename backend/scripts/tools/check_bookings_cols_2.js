const { query } = require('./config/db');

async function checkColumns() {
    try {
        const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings'");
        const columns = res.rows.map(row => row.column_name);
        console.log('COLUMNS_IN_BOOKINGS:');
        console.log(columns.join(','));

        const hasBookedDate = columns.includes('booked_date');
        console.log('HAS_BOOKED_DATE:', hasBookedDate);

    } catch (err) {
        console.error('Error checking columns:', err);
    } finally {
        process.exit();
    }
}

checkColumns();
