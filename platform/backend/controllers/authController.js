const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const pool = require("../config/db");

// SIGNUP
exports.signup = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password required" });
        }

        const existing = await pool.query(
            "SELECT * FROM users WHERE username=$1",
            [username]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2)",
            [username, hashed]
        );

        res.json({ message: "User created successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error signing up" });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE username=$1",
            [username]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({ message: "Wrong password" });
        }

        const token = generateToken(user);

        res.json({ token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error logging in" });
    }
};