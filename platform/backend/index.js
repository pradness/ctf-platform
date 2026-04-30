require("dotenv").config();
const express = require("express");
const cors = require("cors");

const pool = require("./config/db");
const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", require("./routes/authRoutes"));
app.use("/challenges", require("./routes/challengeRoutes"));
app.use("/submit", require("./routes/flagRoutes"));
app.use("/leaderboard", require("./routes/leaderboardRoutes"));

// DB connection check
pool.query("SELECT NOW()", (err, res) => {
    if (err) console.error(err);
    else console.log("DB connected:", res.rows);
});

// ✅ use env PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));