const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
}

// Extract base connection info (to connect to 'postgres' database first)
// Format: postgres://user:password@host:port/database
const baseUrlMatch = dbUrl.match(/(postgres:\/\/.*:.*@.*:\d+)\//);
if (!baseUrlMatch) {
    console.error('Could not parse DATABASE_URL');
    process.exit(1);
}
const baseUrl = baseUrlMatch[1] + '/postgres';
const targetDbName = dbUrl.split('/').pop().split('?')[0];

async function setupDatabase() {
    // 1. Create the database if it doesn't exist
    const client = new Client({ connectionString: baseUrl });
    
    try {
        await client.connect();
        console.log(`Connected to default 'postgres' database.`);
        
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDbName]);
        
        if (res.rowCount === 0) {
            console.log(`Creating database '${targetDbName}'...`);
            // CREATE DATABASE cannot be run in a transaction, and Client doesn't support parameterized CREATE DATABASE
            await client.query(`CREATE DATABASE ${targetDbName}`);
            console.log(`Database '${targetDbName}' created successfully.`);
        } else {
            console.log(`Database '${targetDbName}' already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }

    // 2. Initialize the schema
    const targetClient = new Client({ connectionString: dbUrl });
    
    try {
        await targetClient.connect();
        console.log(`Connected to '${targetDbName}' database.`);
        
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Applying schema from database/schema.sql...');
        await targetClient.query(schemaSql);
        console.log('Schema applied and initial data seeded successfully.');
        
    } catch (err) {
        console.error('Error applying schema:', err);
    } finally {
        await targetClient.end();
    }
}

setupDatabase();
