const db = require('./config/db');

async function findGarbaImage() {
    try {
        const result = await db.query("SELECT title, banner_url FROM events WHERE title ILIKE '%garba%' OR description ILIKE '%garba%'");
        console.log(JSON.stringify(result.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findGarbaImage();
