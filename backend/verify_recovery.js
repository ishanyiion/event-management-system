const { query } = require('./config/db');

async function checkRecovery() {
    try {
        console.log('--- CHECKING AUTO-RECOVERY ---');
        const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'images'");

        if (res.rowCount > 0) {
            console.log("Column 'images' has been AUTOMATICALLY RESTORED.");
            console.log("VERIFICATION_SUCCESSFUL");
        } else {
            console.log("Column 'images' is STILL MISSING.");
            console.log("VERIFICATION_FAILED");
        }

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        process.exit();
    }
}

// Wait for server restart
console.log('Waiting 5 seconds for server to sync...');
setTimeout(checkRecovery, 5000);
