const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // Check if column already exists
        const checkResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='events' AND column_name='upi_id';
        `);

        if (checkResult.rows.length === 0) {
            console.log('Adding upi_id column to events table...');
            await client.query('ALTER TABLE events ADD COLUMN upi_id VARCHAR(255);');
            console.log('Column added successfully.');
        } else {
            console.log('upi_id column already exists.');
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
