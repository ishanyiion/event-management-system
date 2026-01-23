const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function seedData() {
    const client = new Client({ connectionString: dbUrl });

    try {
        await client.connect();
        console.log('Connected to database for seeding.');

        const sqlPath = path.join(__dirname, 'database', 'demo_data.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon and filter out empty queries to avoid multi-statement issues if any
        // However, pg-client query can handle multiple statements if they are separated by semicolons
        // But it's safer to run them if there are no dollar-quoted strings or complex blocks.
        // demo_data.sql is simple.

        console.log('Clearing existing data (optional but recommended for clean demo)...');
        // We'll just append our inserts. If there are unique constraints, it might fail.
        // Let's wrap in a try-catch for each block or just run the whole thing.

        console.log('Executing demo_data.sql...');
        await client.query(sql);
        console.log('Demo data seeded successfully!');

    } catch (err) {
        console.error('Error seeding data:', err.message);
        if (err.message.includes('already exists')) {
            console.log('Some data already exists. You might want to clear your tables first.');
        }
    } finally {
        await client.end();
    }
}

seedData();
