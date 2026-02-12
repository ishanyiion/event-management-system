const db = require('./config/db');

async function migrate() {
    try {
        console.log('Changing booked_date column from DATE to TEXT...');
        // Change column type to TEXT
        await db.query(`
            ALTER TABLE bookings ALTER COLUMN booked_date TYPE TEXT;
        `);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
