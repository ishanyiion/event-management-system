const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/event_db'
});

async function migrate() {
    try {
        await pool.query('ALTER TABLE events ADD COLUMN IF NOT EXISTS proposed_data TEXT;');
        console.log('Migration successful: proposed_data column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
