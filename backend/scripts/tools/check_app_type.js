const { query } = require('./config/db');

async function checkPaymentAppType() {
    try {
        const res = await query("SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'upi_app'");
        console.log('UPI_APP_TYPE:', JSON.stringify(res.rows));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkPaymentAppType();
