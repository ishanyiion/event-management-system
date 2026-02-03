const pg = require('pg');
const { Pool } = pg;
const dotenv = require('dotenv');

// Force DATE types to be returned as strings to avoid timezone shifts
pg.types.setTypeParser(1082, (val) => val);

dotenv.config({ override: true });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
