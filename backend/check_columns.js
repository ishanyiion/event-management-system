const { query } = require('./config/db');

async function checkColumns() {
    try {
        console.log('Checking columns for table events:');
        const eventsResult = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events'");
        eventsResult.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));

        console.log('\nChecking columns for table event_packages:');
        const packagesResult = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_packages'");
        packagesResult.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));

    } catch (err) {
        console.error('Error checking columns:', err);
    } finally {
        process.exit();
    }
}

checkColumns();
