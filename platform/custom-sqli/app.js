const express = require("express");
const mysql = require("mysql2");

const app = express();

// 🔥 IMPORTANT
app.use(express.urlencoded({ extended: true }));

let db;

/* ---------------- WAIT FOR MYSQL ---------------- */
function connectDB() {
    db = mysql.createConnection({
        host: "db",
        user: "root",
        password: "root",
        database: "ctf"
    });

    db.connect((err) => {
        if (err) {
            console.log("⏳ Waiting for MySQL...");
            setTimeout(connectDB, 2000);
        } else {
            console.log("✅ MySQL Connected");
        }
    });
}

connectDB();

/* ---------------- LOGIN PAGE ---------------- */
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

/* ---------------- LOGIN ---------------- */
app.post("/login", (req, res) => {
    console.log("🔥 LOGIN HIT");
    console.log("BODY:", req.body);

    const { username, password } = req.body;

    const query = `
        SELECT * FROM users
        WHERE username='${username}' AND password='${password}'
    `;

    console.log("QUERY:", query);

    db.query(query, (err, results) => {
        if (err) {
            console.log("DB ERROR:", err);
            return res.send("DB ERROR");
        }

        console.log("RESULT:", results);

        if (results.length > 0) {
            res.send(`
                <h3>Login Successful 🎉</h3>
                <pre>${JSON.stringify(results, null, 2)}</pre>
            `);
        } else {
            res.send(`
                <h3>Login Failed ❌</h3>
                <pre>${JSON.stringify(results, null, 2)}</pre>
            `);
        }
    });
});

app.listen(80, () => console.log("🚀 App running on port 80"));
