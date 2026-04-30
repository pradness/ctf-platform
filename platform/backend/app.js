require("./config/env");

const express = require("express");
const cors = require("cors");

function createApp() {
    const app = express();

    app.use(express.json());
    app.use(cors());

    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });

    app.use("/auth", require("./routes/authRoutes"));
    app.use("/challenges", require("./routes/challengeRoutes"));
    app.use("/submit", require("./routes/flagRoutes"));
    app.use("/leaderboard", require("./routes/leaderboardRoutes"));

    return app;
}

module.exports = { createApp };
