const db = require('../config/db');

/**
 * Source of Truth for Database Schema
 * This defines the required tables and their columns.
 */
const schemaDefinition = {
    users: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'name', type: 'VARCHAR(255) NOT NULL' },
        { name: 'email', type: 'VARCHAR(255) UNIQUE NOT NULL' },
        { name: 'password_hash', type: 'VARCHAR(255) NOT NULL' },
        { name: 'role', type: 'VARCHAR(50) DEFAULT \'CLIENT\'' }, // Using VARCHAR for simplicity/compatibility
        { name: 'status', type: 'VARCHAR(50) DEFAULT \'ACTIVE\'' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ],
    categories: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'name', type: 'VARCHAR(255) NOT NULL' }
    ],
    events: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'organizer_id', type: 'INTEGER REFERENCES users(id) ON DELETE CASCADE' },
        { name: 'category_id', type: 'INTEGER REFERENCES categories(id) ON DELETE SET NULL' },
        { name: 'title', type: 'VARCHAR(100) NOT NULL' },
        { name: 'description', type: 'TEXT' },
        { name: 'location', type: 'VARCHAR(255)' },
        { name: 'city', type: 'VARCHAR(255)' },
        { name: 'start_date', type: 'DATE NOT NULL' },
        { name: 'end_date', type: 'DATE NOT NULL' },
        { name: 'start_time', type: 'TIME' },
        { name: 'end_time', type: 'TIME' },
        { name: 'max_capacity', type: 'INTEGER DEFAULT 0' },
        { name: 'status', type: 'VARCHAR(50) DEFAULT \'PENDING\'' },
        { name: 'banner_url', type: 'VARCHAR(255)' },
        { name: 'images', type: 'TEXT' },
        { name: 'edit_permission', type: 'VARCHAR(50)' },
        { name: 'proposed_data', type: 'JSONB' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ],
    event_schedules: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'event_id', type: 'INTEGER REFERENCES events(id) ON DELETE CASCADE' },
        { name: 'event_date', type: 'DATE NOT NULL' },
        { name: 'start_time', type: 'TIME NOT NULL' },
        { name: 'end_time', type: 'TIME NOT NULL' }
    ],
    event_packages: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'event_id', type: 'INTEGER REFERENCES events(id) ON DELETE CASCADE' },
        { name: 'package_name', type: 'VARCHAR(100) NOT NULL' },
        { name: 'price', type: 'DECIMAL(10, 2) NOT NULL' },
        { name: 'features', type: 'TEXT' },
        { name: 'capacity', type: 'INTEGER DEFAULT 0' }
    ],
    bookings: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'event_id', type: 'INTEGER REFERENCES events(id) ON DELETE CASCADE' },
        { name: 'client_id', type: 'INTEGER REFERENCES users(id) ON DELETE CASCADE' },
        { name: 'total_amount', type: 'DECIMAL(10, 2) NOT NULL' },
        { name: 'qty', type: 'INTEGER DEFAULT 1' },
        { name: 'booking_status', type: 'VARCHAR(50) DEFAULT \'PENDING\'' },
        { name: 'payment_status', type: 'VARCHAR(50) DEFAULT \'UNPAID\'' },
        { name: 'booked_date', type: 'TEXT' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ],
    booking_items: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'booking_id', type: 'INTEGER REFERENCES bookings(id) ON DELETE CASCADE' },
        { name: 'package_id', type: 'INTEGER REFERENCES event_packages(id) ON DELETE CASCADE' },
        { name: 'qty', type: 'INTEGER NOT NULL' },
        { name: 'price_at_time', type: 'DECIMAL(10, 2) NOT NULL' }
    ],
    payments: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'booking_id', type: 'INTEGER REFERENCES bookings(id) ON DELETE CASCADE' },
        { name: 'amount', type: 'DECIMAL(10, 2) NOT NULL' },
        { name: 'method', type: 'VARCHAR(50) DEFAULT \'UPI\'' },
        { name: 'upi_app', type: 'VARCHAR(50)' },
        { name: 'transaction_id', type: 'VARCHAR(255) UNIQUE NOT NULL' },
        { name: 'status', type: 'VARCHAR(50) DEFAULT \'SUCCESS\'' },
        { name: 'paid_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ],

    reviews: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'event_id', type: 'INTEGER REFERENCES events(id) ON DELETE CASCADE' },
        { name: 'client_id', type: 'INTEGER REFERENCES users(id) ON DELETE CASCADE' },
        { name: 'rating', type: 'INTEGER CHECK (rating >= 1 AND rating <= 5)' },
        { name: 'comment', type: 'TEXT' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ],
    tickets: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'booking_id', type: 'INTEGER REFERENCES bookings(id) ON DELETE CASCADE' },
        { name: 'package_id', type: 'INTEGER REFERENCES event_packages(id) ON DELETE CASCADE' },
        { name: 'ticket_number', type: 'VARCHAR(50) UNIQUE NOT NULL' },
        { name: 'status', type: 'VARCHAR(50) DEFAULT \'VALID\'' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ]
};

const syncDatabase = async () => {
    try {
        console.log('--- STARTING DATABASE SYNC ---');

        for (const [tableName, columns] of Object.entries(schemaDefinition)) {
            // 1. Check if table exists
            const tableCheck = await db.query(
                "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
                [tableName]
            );

            if (tableCheck.rowCount === 0) {
                console.log(`Table '${tableName}' is missing. Creating...`);
                const colDefs = columns.map(col => `${col.name} ${col.type}`).join(', ');
                await db.query(`CREATE TABLE ${tableName} (${colDefs})`);
                console.log(`Table '${tableName}' created successfully.`);
            } else {
                // 2. Check for missing columns in existing table
                for (const col of columns) {
                    const colCheck = await db.query(
                        "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
                        [tableName, col.name]
                    );

                    if (colCheck.rowCount === 0) {
                        console.log(`Column '${col.name}' in table '${tableName}' is missing. Adding...`);
                        // For simplicity, we just append the column type. 
                        // Note: Some constraints like REFERENCES might need more care if added later, 
                        // but for basic columns like 'images' or 'capacity', this works perfectly.
                        await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type.replace('SERIAL PRIMARY KEY', 'INTEGER')}`);
                        console.log(`Column '${col.name}' added to table '${tableName}'.`);
                    }
                }
            }
        }

        console.log('--- DATABASE SYNC COMPLETED ---');
    } catch (err) {
        console.error('DATABASE SYNC FAILED:', err);
    }
};

module.exports = syncDatabase;
