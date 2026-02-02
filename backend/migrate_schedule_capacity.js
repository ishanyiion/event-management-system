const db = require('./config/db');

async function migrate() {
    try {
        console.log('Adding capacity column to event_schedules...');
        const check = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='event_schedules' AND column_name='capacity'
        `);

        if (check.rows.length === 0) {
            await db.query(`ALTER TABLE event_schedules ADD COLUMN capacity INTEGER DEFAULT 0;`);
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
