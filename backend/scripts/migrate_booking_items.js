const db = require('../config/db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Create booking_items table
        await db.query(`
            CREATE TABLE IF NOT EXISTS booking_items (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
                package_id INTEGER REFERENCES event_packages(id) ON DELETE CASCADE,
                qty INTEGER DEFAULT 1,
                price_at_time DECIMAL(10, 2) NOT NULL
            )
        `);
        console.log('Table booking_items created successfully.');

        // Optional: Keep bookings compatible for now, or migrate existing data
        // For simplicity, we'll just start fresh with new bookings.

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
