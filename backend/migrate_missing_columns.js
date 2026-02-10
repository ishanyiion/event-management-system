const db = require('./config/db');

async function migrate() {
    try {
        console.log('Adding missing columns to events and event_packages...');

        // Add images column to events if it doesn't exist
        await db.query(`
            ALTER TABLE events ADD COLUMN IF NOT EXISTS images TEXT;
        `);
        console.log('Added images column to events table.');

        // Add capacity column to event_packages if it doesn't exist
        await db.query(`
            ALTER TABLE event_packages ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;
        `);
        console.log('Added capacity column to event_packages table.');

        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
