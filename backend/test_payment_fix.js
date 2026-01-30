const { query } = require('./config/db');

async function testPaymentFix() {
    const booking_id = 6;
    const transaction_id = 'FIX_TEST_' + Date.now();
    const upi_app = 'PhonePe'; // Testing with CamelCase string

    try {
        console.log('--- TESTING PAYMENT FIX ---');

        // Check if PhonePe works now (it should if it's the correct case)
        await query(
            'INSERT INTO payments (booking_id, amount, upi_app, transaction_id, status) VALUES ($1, $2, $3, $4, \'SUCCESS\')',
            [booking_id, 2500, upi_app, transaction_id]
        );

        console.log("Payment with 'PhonePe' succeeded!");
        console.log("VERIFICATION_SUCCESSFUL");

    } catch (err) {
        console.error('Test failed:', err.message);
        console.log("VERIFICATION_FAILED");
    } finally {
        process.exit();
    }
}

testPaymentFix();
