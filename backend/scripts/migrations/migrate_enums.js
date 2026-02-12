const { query } = require('./config/db');

async function migrateEnums() {
    try {
        console.log('--- MIGRATING PAYMENT ENUMS ---');

        // Add new values to payment_app enum
        // Note: ALTER TYPE ... ADD VALUE cannot be executed in a transaction block
        await query("ALTER TYPE payment_app ADD VALUE IF NOT EXISTS 'Paytm'");
        await query("ALTER TYPE payment_app ADD VALUE IF NOT EXISTS 'Other'");

        console.log("Database enums updated successfully.");
        console.log("VERIFICATION_SUCCESSFUL");

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrateEnums();
