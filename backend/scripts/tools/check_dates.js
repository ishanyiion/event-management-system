const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/event_management' });
async function check() {
    try {
        console.log("--- Events ---");
        const res = await pool.query("SELECT id, title, start_date, end_date FROM events WHERE title ILIKE '%ai workshop%';");
        console.log(JSON.stringify(res.rows, null, 2));

        if (res.rows.length > 0) {
            console.log("\n--- Schedules ---");
            const res2 = await pool.query("SELECT event_date FROM event_schedules WHERE event_id = $1 ORDER BY event_date;", [res.rows[0].id]);
            console.log(JSON.stringify(res2.rows, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
