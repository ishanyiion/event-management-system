const db = require('./config/db');

async function migrate() {
    try {
        console.log('Creating tickets table...');
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
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
