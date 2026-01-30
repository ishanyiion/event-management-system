const { query } = require('./config/db');

async function testSync() {
    try {
        console.log('--- SIMULATING MISSING COLUMN ---');
        // Delete a column to test auto-recovery
        await query("ALTER TABLE events DROP COLUMN IF EXISTS images");
        console.log("Column 'images' dropped from 'events' table.");

        console.log('\nWait for nodemon to restart the server...');
        // The server.js was modified, so nodemon should have restarted it.
        // But to be sure, we can wait a few seconds and then check the database again.

    } catch (err) {
        console.error('Test simulation failed:', err);
    } finally {
        process.exit();
    }
}

testSync();
