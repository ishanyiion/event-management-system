const { query } = require('./config/db');

async function verify() {
    try {
        console.log('--- VERIFYING DATABASE FIXES ---');

        const tablesRes = await query("SELECT table_name FROM information_schema.tables WHERE table_name IN ('booking_items', 'tickets')");
        console.log('Tables found:', tablesRes.rows.map(r => r.table_name).join(', '));

        const colsRes = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booked_date'");
        console.log('Bookings columns found:', colsRes.rows.map(r => r.column_name).join(', '));

        if (tablesRes.rows.length === 2 && colsRes.rows.length === 1) {
            console.log('VERIFICATION_PASSED');
        } else {
            console.log('VERIFICATION_FAILED');
        }

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        process.exit();
    }
}

verify();
