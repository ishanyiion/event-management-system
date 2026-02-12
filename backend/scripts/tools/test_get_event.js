const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/event_management' });

async function test(eventId) {
    try {
        console.log(`--- Fetching Event ${eventId} ---`);
        const event = await pool.query('SELECT e.*, c.name as category_name FROM events e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = $1', [eventId]);
        if (event.rows.length === 0) {
            console.log('Event not found');
            return;
        }

        const packagesQuery = await pool.query(
            `SELECT p.*, 
             COALESCE((SELECT SUM(bi.qty) FROM booking_items bi JOIN bookings b ON bi.booking_id = b.id WHERE bi.package_id = p.id AND b.booking_status = 'CONFIRMED'), 0) as total_sold
             FROM event_packages p WHERE p.event_id = $1`,
            [eventId]
        );

        const packages = packagesQuery.rows;

        // Fetch daily sold stats
        for (let pkg of packages) {
            const dailyRes = await pool.query(
                `SELECT event_date, SUM(qty) as sold
                 FROM booking_items bi
                 JOIN bookings b ON bi.booking_id = b.id
                 WHERE bi.package_id = $1 AND b.booking_status = 'CONFIRMED'
                 GROUP BY event_date`,
                [pkg.id]
            );

            const dailyMap = {};
            dailyRes.rows.forEach(r => {
                if (r.event_date) {
                    const dateKey = r.event_date.split('T')[0];
                    dailyMap[dateKey] = parseInt(r.sold || 0);
                }
            });
            pkg.daily_sold = dailyMap;
            pkg.sold_qty = pkg.total_sold; // keep for backward compatibility
        }

        const schedule = await pool.query('SELECT * FROM event_schedules WHERE event_id = $1 ORDER BY event_date ASC', [eventId]);

        const result = {
            ...event.rows[0],
            images: typeof event.rows[0].images === 'string' ? JSON.parse(event.rows[0].images) : (event.rows[0].images || []),
            packages,
            schedule: schedule.rows
        };
        console.log('Success!');
        // console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error in logic:', err);
    } finally {
        await pool.end();
    }
}

// Extract event ID from previous check_dates.js output if possible, or just use 28 (AI workshop)
test(28);
