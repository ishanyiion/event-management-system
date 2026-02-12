const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/event_management' });

async function unblock() {
    try {
        await pool.query("UPDATE users SET status = 'ACTIVE' WHERE role = 'ADMIN'");
        console.log('Admins unblocked');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

unblock();
