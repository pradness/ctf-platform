require('dotenv').config({ path: '../.env' });
const pool = require('./config/db');
(async () => {
    try {
        const res = await pool.query('SELECT * FROM challenges');
        console.log("Challenges:", res.rows);
    } catch (e) { console.error(e); }
    process.exit();
})();
