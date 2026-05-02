require("dotenv").config();
console.log("DB PASSWORD:", process.env.DB_PASSWORD);
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const pool = require("./config/db");

const app = express();
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 1000, // max 10 requests per minute
});

app.use(limiter);
/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(cors());

// request logger
app.use((req, res, next) => {
    console.log("➡️ Incoming:", req.method, req.url);
    next();
});

/* -------------------- ROUTES -------------------- */
const authRoutes = require("./routes/authRoutes");
console.log("✅ Mounting /auth routes");
app.use("/auth", authRoutes);
app.use("/challenges", require("./routes/challengeRoutes"));
app.use("/submit", require("./routes/flagRoutes"));
app.use("/leaderboard", require("./routes/leaderboardRoutes"));
app.use("/container", require("./routes/containerRoutes")); // 🔥 NEW

// root route
app.get("/", (req, res) => {
    res.send("CTF Backend Running 🚀");
});

/* -------------------- DB TEST -------------------- */
pool.query("SELECT NOW()")
    .then(res => console.log("DB connected:", res.rows))
    .catch(err => console.error("DB ERROR:", err));

/* -------------------- CLEANUP SYSTEM -------------------- */
setInterval(async () => {
    try {
        const expired = await pool.query(
            "SELECT * FROM containers WHERE expires_at < NOW()"
        );

        for (let c of expired.rows) {
            console.log("🧹 Removing container:", c.container_id);

            exec(`docker stop ${c.container_id}`);
            exec(`docker rm ${c.container_id}`);
        }

        await pool.query(
            "DELETE FROM containers WHERE expires_at < NOW()"
        );

    } catch (err) {
        console.error("Cleanup error:", err);
    }
}, 60000); // runs every 60 sec

/* -------------------- 404 HANDLER -------------------- */
app.use((req, res) => {
    console.log("❌ Route not found:", req.url);
    res.status(404).json({ message: "Route not found" });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
    console.error("🔥 GLOBAL ERROR:", err);
    res.status(500).json({
        message: "Internal Server Error",
        error: err.message
    });
});

/* -------------------- SERVER START -------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} 🚀`);
});
