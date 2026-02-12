const db = require('./config/db');

async function checkMobile() {
    try {
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mobile'");
        if (res.rows.length > 0) {
            console.log("Column 'mobile' exists.");
        } else {
            console.log("Column 'mobile' DOES NOT exist.");
        }
    } catch (err) {
        console.error(err);
    }
}

checkMobile();
