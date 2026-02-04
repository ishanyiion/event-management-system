const db = require('./config/db');

async function migrate() {
    try {
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20)");
        console.log("Added mobile column to users table.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrate();
