const { query } = require('./config/db');

async function checkEnums() {
    try {
        console.log('--- CHECKING ENUM TYPES ---');
        const types = await query("SELECT typname FROM pg_type WHERE typtype = 'e'");
        console.log('Enums:', JSON.stringify(types.rows.map(r => r.typname)));

        console.log('\n--- CHECKING PAYMENTS STATUS TYPE ---');
        const paymentsStatus = await query("SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'status'");
        console.log('Payments Status Type:', JSON.stringify(paymentsStatus.rows));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkEnums();
