const db = require('./config/db');

async function migrate() {
    try {
        console.log('Adding booked_date column to bookings table...');
        await db.query(`
            ALTER TABLE bookings ADD COLUMN booked_date DATE;
        `);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
