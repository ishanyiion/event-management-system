const db = require('./config/db');

async function migrate() {
    try {
        console.log('Adding event_date column to tickets...');
        // Check if column exists first
        const check = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='tickets' AND column_name='event_date'
        `);

        if (check.rows.length === 0) {
            await db.query(`ALTER TABLE tickets ADD COLUMN event_date TEXT;`);
            console.log('Column added successfully!');
        } else {
            console.log('Column already exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
