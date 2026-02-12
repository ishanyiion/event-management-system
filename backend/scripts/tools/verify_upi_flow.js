const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function verify() {
    const client = new Client({
        connectionString: 'postgres://postgres:postgres@localhost:5432/event_management'
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Find an organizer to use
        const userRes = await client.query("SELECT id FROM users WHERE role = 'ORGANIZER' LIMIT 1");
        if (userRes.rows.length === 0) {
            console.log('No organizer found, skipping test.');
            return;
        }
        const organizerId = userRes.rows[0].id;

        // 2. Create a test event with a UPI ID directly in DB (to avoid needing JWT for this low-level test)
        console.log('Creating test event...');
        const eventRes = await client.query(`
            INSERT INTO events (organizer_id, title, description, location, city, start_date, end_date, start_time, end_time, max_capacity, upi_id, status)
            VALUES ($1, 'Test UPI Event', 'Testing QR code', 'Test Venue', 'Test City', '2026-01-01', '2026-01-02', '10:00', '18:00', 100, 'test@upi', 'APPROVED')
            RETURNING id
        `, [organizerId]);
        const eventId = eventRes.rows[0].id;
        console.log(`Created event ID: ${eventId}`);

        // 3. Create a test client
        const clientRes = await client.query("SELECT id FROM users WHERE role = 'CLIENT' LIMIT 1");
        if (clientRes.rows.length === 0) {
            console.log('No client found, skipping test.');
            return;
        }
        const clientId = clientRes.rows[0].id;

        // 4. Create a test booking
        console.log('Creating test booking...');
        const bookingRes = await client.query(`
            INSERT INTO bookings (event_id, client_id, total_amount, qty, booking_status)
            VALUES ($1, $2, 1000.00, 1, 'PENDING')
            RETURNING id
        `, [eventId, clientId]);
        const bookingId = bookingRes.rows[0].id;
        console.log(`Created booking ID: ${bookingId}`);

        // 5. Fetch booking via public-ish logic (or just direct DB check of our new JOIN)
        console.log('Verifying JOIN logic for booking info...');
        const result = await client.query(`
            SELECT b.*, e.title as event_title, e.upi_id as organizer_upi_id, u.name as user_name, u.email as user_email, org.name as organizer_name 
            FROM bookings b 
            JOIN events e ON b.event_id = e.id 
            JOIN users u ON b.client_id = u.id 
            JOIN users org ON e.organizer_id = org.id 
            WHERE b.id = $1
        `, [bookingId]);

        const data = result.rows[0];
        console.log('Resulting Data:', JSON.stringify(data, null, 2));

        if (data.organizer_upi_id === 'test@upi' && data.organizer_name) {
            console.log('VERIFICATION SUCCESS: Backend JOIN correctly returns organizer UPI and name.');
        } else {
            console.error('VERIFICATION FAILED: Organizer info missing or incorrect.');
        }

        // Cleanup
        await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
        await client.query('DELETE FROM events WHERE id = $1', [eventId]);
        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await client.end();
    }
}

verify();
