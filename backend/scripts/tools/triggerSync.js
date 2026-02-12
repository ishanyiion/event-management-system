const syncDatabase = require('./utils/dbSync');
syncDatabase().then(() => {
    console.log('Sync finished');
    process.exit(0);
}).catch(err => {
    console.error('Sync failed', err);
    process.exit(1);
});
