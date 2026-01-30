const { query } = require('./config/db');

async function verifyFix() {
    try {
        console.log('--- VERIFYING API RESPONSE FOR EVENT 7 ---');
        // Simulate what the controller does
        const eventRes = await query("SELECT * FROM events WHERE id = 7");
        const event = eventRes.rows[0];

        const images = typeof event.images === 'string' ? JSON.parse(event.images) : (event.images || []);

        console.log('Original images type:', typeof event.images);
        console.log('Parsed images type:', typeof images);
        console.log('Is array:', Array.isArray(images));
        console.log('Images content:', JSON.stringify(images));

        if (Array.isArray(images)) {
            console.log('VERIFICATION_SUCCESSFUL');
        } else {
            console.log('VERIFICATION_FAILED');
        }

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        process.exit();
    }
}

verifyFix();
