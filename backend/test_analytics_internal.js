const db = require('./config/db');

async function runTest() {
    try {
        console.log("Testing Analytics Query...");
        // ID 25 from screenshot
        const id = 25;

        const dailyStatsRes = await db.query(
            `SELECT 
                es.event_date,
                es.capacity as daily_capacity,
                COALESCE(SUM(bi.qty), 0) as daily_sold,
                COALESCE(SUM(bi.qty * bi.price_at_time), 0) as daily_revenue
             FROM event_schedules es
             LEFT JOIN booking_items bi ON bi.event_date::DATE = es.event_date AND bi.booking_id IN (
                SELECT id FROM bookings WHERE event_id = $1 AND booking_status = 'CONFIRMED'
             )
             WHERE es.event_id = $1
             GROUP BY es.event_date, es.capacity
             ORDER BY es.event_date ASC`,
            [id]
        );
        console.log("Success:", dailyStatsRes.rows);
    } catch (err) {
        console.error("SQL Error:", err.message);
        console.error("Detail:", err.detail || "No detail");
    } finally {
        process.exit();
    }
}

runTest();
