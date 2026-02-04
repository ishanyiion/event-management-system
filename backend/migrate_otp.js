const db = require('./config/db');

async function migrateOtp() {
    try {
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(6)");
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP");
        console.log("Added otp and otp_expires columns to users table.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrateOtp();
