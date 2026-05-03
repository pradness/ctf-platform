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
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>CTF SQLi Terminal</title>
            <style>
                :root {
                    --bg-dark: #050505;
                    --bg-panel: rgba(10, 10, 10, 0.94);
                    --neon-green: #00ff41;
                    --neon-blue: #00e5ff;
                    --neon-red: #ff003c;
                    --text-main: #e8e8e8;
                    --text-dim: #8a8a8a;
                    --border-glow: rgba(0, 255, 65, 0.2);
                    --font-main: 'Fira Code', monospace;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    min-height: 100vh;
                    background-color: var(--bg-dark);
                    color: var(--text-main);
                    font-family: var(--font-main);
                    overflow-x: hidden;
                    background-image:
                        radial-gradient(circle at 20% 20%, rgba(0, 255, 65, 0.05), transparent 24%),
                        radial-gradient(circle at 80% 30%, rgba(0, 229, 255, 0.04), transparent 22%),
                        linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
                    background-size: auto, auto, 100% 3px, 3px 100%;
                    background-attachment: fixed;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem 1rem;
                }

                body::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background: linear-gradient(to bottom, rgba(255,255,255,0.04), transparent 12%, transparent 88%, rgba(255,255,255,0.03));
                    mix-blend-mode: screen;
                    opacity: 0.35;
                }

                .shell {
                    width: 100%;
                    max-width: 880px;
                    background: var(--bg-panel);
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 0 0 1px rgba(0, 255, 65, 0.08), 0 18px 50px rgba(0, 0, 0, 0.45);
                    position: relative;
                    overflow: hidden;
                }

                .shell::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.4), rgba(255,255,255,0.1), transparent);
                }

                .hero {
                    padding: 2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }

                .terminal-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.45rem;
                    padding: 0.35rem 0.7rem;
                    border: 1px solid rgba(0, 255, 65, 0.22);
                    color: var(--neon-green);
                    font-size: 0.75rem;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    background: rgba(0, 255, 65, 0.04);
                }

                h1 {
                    margin-top: 1rem;
                    font-size: clamp(2rem, 4vw, 3rem);
                    text-transform: uppercase;
                    letter-spacing: 0.16em;
                    color: #fff;
                }

                p.sub {
                    margin-top: 0.75rem;
                    color: var(--text-dim);
                    line-height: 1.6;
                }

                .panel {
                    padding: 2rem;
                }

                .mini-terminal {
                    display: flex;
                    gap: 0.6rem;
                    align-items: center;
                    font-size: 0.82rem;
                    color: var(--text-main);
                    background: rgba(0, 0, 0, 0.52);
                    border: 1px solid rgba(255,255,255,0.08);
                    padding: 0.8rem 0.9rem;
                    margin-bottom: 1rem;
                    overflow-wrap: anywhere;
                }

                .prompt { color: var(--neon-green); }

                .terminal-strip {
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    padding: 0.85rem 1rem;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(0,0,0,0.55);
                    color: var(--text-dim);
                    font-size: 0.78rem;
                    margin-bottom: 1.5rem;
                }

                form {
                    display: grid;
                    gap: 1rem;
                }

                .input {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.62);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 0;
                    padding: 0.9rem 1rem;
                    color: white;
                    font-family: var(--font-main);
                    outline: none;
                }

                .input:focus {
                    border-color: var(--neon-green);
                    box-shadow: 0 0 10px rgba(0, 255, 65, 0.2);
                }

                .actions {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    margin-top: 0.5rem;
                }

                button {
                    background: transparent;
                    color: var(--neon-green);
                    border: 1px solid var(--neon-green);
                    padding: 0.85rem 1.2rem;
                    border-radius: 0;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    font-family: var(--font-main);
                }

                button:hover {
                    background: rgba(0, 255, 65, 0.1);
                }

                .footer {
                    margin-top: 1.5rem;
                    color: var(--text-dim);
                    font-size: 0.85rem;
                    line-height: 1.6;
                }

                .footer code {
                    color: var(--neon-blue);
                    background: rgba(255,255,255,0.05);
                    padding: 2px 6px;
                }

                @media (max-width: 640px) {
                    .hero, .panel { padding: 1.25rem; }
                    .terminal-strip { flex-direction: column; gap: 0.35rem; }
                }
            </style>
        </head>
        <body>
            <main class="shell">
                <section class="hero">
                    <div class="terminal-badge">ACCESS GATE</div>
                    <h1>Login SQLi Challenge</h1>
                    <p class="sub">Use the terminal-like form below to probe the authentication query. The goal is still the same: extract the hidden secret from the SQLite-backed lab.</p>
                </section>

                <section class="panel">
                    <div class="terminal-strip">
                        <span>root@ctf:~#</span>
                        <span>sqlite://memory</span>
                    </div>

                    <div class="mini-terminal">
                        <span class="prompt">root@ctf:~#</span>
                        <span>SELECT * FROM users WHERE username='...' AND password='...';</span>
                    </div>

                    <form method="POST" action="/login">
                        <input class="input" name="username" placeholder="Username" />
                        <input class="input" name="password" placeholder="Password" type="password" />
                        <div class="actions">
                            <button type="submit">Login</button>
                        </div>
                    </form>

                    <div class="footer">
                        <p>The lab is intentionally vulnerable. Find the flag and prove control of the query path.</p>
                        <p>Flag format: <code>hackme{...}</code></p>
                    </div>
                </section>
            </main>
        </body>
        </html>
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
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>CTF SQLi Result</title>
                    <style>
                        :root {
                            --bg-dark: #050505;
                            --bg-panel: rgba(10, 10, 10, 0.94);
                            --neon-green: #00ff41;
                            --neon-blue: #00e5ff;
                            --text-main: #e8e8e8;
                            --text-dim: #8a8a8a;
                            --font-main: 'Fira Code', monospace;
                        }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            min-height: 100vh;
                            background: var(--bg-dark);
                            color: var(--text-main);
                            font-family: var(--font-main);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 2rem 1rem;
                        }
                        .shell {
                            width: 100%;
                            max-width: 900px;
                            background: var(--bg-panel);
                            border: 1px solid rgba(255,255,255,0.08);
                            box-shadow: 0 0 0 1px rgba(0, 255, 65, 0.08), 0 18px 50px rgba(0, 0, 0, 0.45);
                            padding: 2rem;
                        }
                        h2 { text-transform: uppercase; letter-spacing: 0.16em; margin-bottom: 0.75rem; }
                        p { color: var(--text-dim); margin-bottom: 1.25rem; }
                        .ok { color: var(--neon-green); margin-bottom: 1rem; }
                        .mini-terminal {
                            display: flex;
                            gap: 0.6rem;
                            align-items: center;
                            font-size: 0.82rem;
                            color: var(--text-main);
                            background: rgba(0, 0, 0, 0.52);
                            border: 1px solid rgba(255,255,255,0.08);
                            padding: 0.8rem 0.9rem;
                            margin-bottom: 1rem;
                            overflow-wrap: anywhere;
                        }
                        .prompt { color: var(--neon-green); }
                        pre {
                            white-space: pre-wrap;
                            word-break: break-word;
                            background: rgba(0,0,0,0.55);
                            border: 1px solid rgba(255,255,255,0.08);
                            padding: 1rem;
                            color: var(--neon-blue);
                        }
                    </style>
                </head>
                <body>
                    <main class="shell">
                        <h2>Login Successful</h2>
                        <p class="ok">ACCESS GRANTED</p>
                        <div class="mini-terminal">
                            <span class="prompt">root@ctf:~#</span>
                            <span>query returned privileged rows</span>
                        </div>
                        <pre>${JSON.stringify(results, null, 2)}</pre>
                    </main>
                </body>
                </html>
            `);
        } else {
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>CTF SQLi Result</title>
                    <style>
                        :root {
                            --bg-dark: #050505;
                            --bg-panel: rgba(10, 10, 10, 0.94);
                            --neon-red: #ff003c;
                            --text-main: #e8e8e8;
                            --text-dim: #8a8a8a;
                            --font-main: 'Fira Code', monospace;
                        }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            min-height: 100vh;
                            background: var(--bg-dark);
                            color: var(--text-main);
                            font-family: var(--font-main);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 2rem 1rem;
                        }
                        .shell {
                            width: 100%;
                            max-width: 700px;
                            background: var(--bg-panel);
                            border: 1px solid rgba(255,255,255,0.08);
                            box-shadow: 0 0 0 1px rgba(255, 0, 60, 0.08), 0 18px 50px rgba(0, 0, 0, 0.45);
                            padding: 2rem;
                        }
                        h3 { text-transform: uppercase; letter-spacing: 0.16em; margin-bottom: 0.75rem; color: var(--neon-red); }
                        p { color: var(--text-dim); }
                    </style>
                </head>
                <body>
                    <main class="shell">
                        <h3>Login Failed</h3>
                        <p>ACCESS DENIED</p>
                    </main>
                </body>
                </html>
            `);
        }
    });
});

/* -------------------- START -------------------- */
app.listen(80, () => {
    console.log("🚀 App running on port 80");
});
