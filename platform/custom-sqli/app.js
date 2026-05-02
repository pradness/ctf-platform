const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(express.urlencoded({ extended: true }));

/* -------------------- FLAG FROM ENV -------------------- */
const FLAG = process.env.FLAG || "FLAG{default}";

/* -------------------- DB SETUP -------------------- */
const db = new sqlite3.Database(":memory:");

db.serialize(() => {
    console.log("📦 Initializing SQLite DB...");
    console.log("🚩 FLAG:", FLAG);

    db.run(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            password TEXT,
            secret TEXT
        )
    `);

    // ✅ INSERT FLAG HERE (dynamic)
    db.run(`
        INSERT INTO users (username, password, secret)
        VALUES ('admin', 'admin', '${FLAG}')
    `);

    console.log("✅ SQLite Ready");
});

/* -------------------- HOME -------------------- */
app.get("/", (req, res) => {
    res.send(`
        <h2>Login SQLi Challenge</h2>
        <form method="POST" action="/login">
            <input name="username" placeholder="Username"/><br><br>
            <input name="password" placeholder="Password"/><br><br>
            <button type="submit">Login</button>
        </form>
    `);
});

/* -------------------- LOGIN -------------------- */
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const query = `
        SELECT * FROM users
        WHERE username='${username}' AND password='${password}'
    `;

    console.log("🔥 QUERY:", query);

    db.all(query, (err, results) => {
        if (err) {
            console.log("❌ DB ERROR:", err.message);
            return res.send("DB ERROR");
        }

        if (results.length > 0) {
            res.send(`
                <h3>Login Successful 🎉</h3>
                <pre>${JSON.stringify(results, null, 2)}</pre>
            `);
        } else {
            res.send(`<h3>Login Failed ❌</h3>`);
        }
    });
});

/* -------------------- START -------------------- */
app.listen(80, () => {
    console.log("🚀 App running on port 80");
});
