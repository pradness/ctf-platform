require("./config/env");

const { createApp } = require("./app");
const pool = require("./config/db");

const app = createApp();

pool.query("SELECT NOW()")
    .then(() => {
        console.log("Database connected successfully");
    })
    .catch((err) => {
        console.error("Database connection failed:", err.message);
    });

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`CTF Backend running on port ${PORT}`);
});