const { query } = require('./config/db');

async function verify() {
    try {
        const res = await query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
        console.log('Tables in database:');
        res.rows.forEach(row => console.log(`- ${row.table_name}`));

        const userCount = await query('SELECT count(*) FROM users');
        console.log(`\nUser count: ${userCount.rows[0].count}`);

        const categoryCount = await query('SELECT count(*) FROM categories');
        console.log(`Category count: ${categoryCount.rows[0].count}`);

        console.log('\nVerification successful!');
    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        process.exit();
    }
}

verify();
