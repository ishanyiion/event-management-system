const db = require('./config/db');

async function migrate() {
    try {
        console.log('Applying database fixes for booking and analytics system...');

        await db.query('BEGIN');

        // 1. Add booked_date to bookings if it doesn't exist
        await db.query(`
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booked_date TEXT;
        `);
        console.log('Added booked_date column to bookings table.');

        // 2. Create booking_items table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS booking_items (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
                package_id INTEGER REFERENCES event_packages(id) ON DELETE CASCADE,
                qty INTEGER NOT NULL,
                price_at_time DECIMAL(10, 2) NOT NULL
            );
        `);
        console.log('Created booking_items table.');

        // 3. Create tickets table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
                package_id INTEGER REFERENCES event_packages(id) ON DELETE CASCADE,
                ticket_number VARCHAR(50) UNIQUE NOT NULL,
                status VARCHAR(20) DEFAULT 'VALID',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created tickets table.');

        await db.query('COMMIT');
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
