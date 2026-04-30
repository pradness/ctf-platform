require("./config/env");
const pool = require("./config/db");
const { createApp } = require("./app");

const app = createApp();

async function startServer() {
    try {
        const res = await pool.query("SELECT NOW()");
        console.log("DB connected:", res.rows[0]);
    } catch (err) {
        console.error("DB connection failed:", err.message || err.code || err);
    }

    const port = process.env.PORT || 3000;

    return app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
