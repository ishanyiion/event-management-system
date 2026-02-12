const db = require('./config/db');

async function checkUser() {
    try {
        const res = await db.query("SELECT id, name, email, mobile, role FROM users WHERE email = 'daxp.yiion@gmail.com'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUser();
