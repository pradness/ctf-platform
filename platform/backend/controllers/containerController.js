const { exec } = require("child_process");
const util = require("util");
const crypto = require("crypto");
const pool = require("../config/db");

const execAsync = util.promisify(exec);

/* -------------------- START CHALLENGE -------------------- */
exports.startChallenge = async (req, res) => {
    try {
        const userId = req.user.id;
        const challengeId = 1;

        const existing = await pool.query(
            "SELECT * FROM containers WHERE user_id=$1",
            [userId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                message: "You already have an active container"
            });
        }

        const randomPort = Math.floor(4000 + Math.random() * 1000);

        const flag = `FLAG{${userId}_${crypto.randomBytes(4).toString("hex")}}`;
        console.log("Generated flag:", flag);

        await pool.query(
            "INSERT INTO user_flags (user_id, challenge_id, flag) VALUES ($1,$2,$3)",
            [userId, challengeId, flag]
        );

        const { stdout } = await execAsync(
            `docker run -d -p ${randomPort}:80 custom-sqli`
        );

        const containerId = stdout.trim();
        console.log("Container started:", containerId);

        // ⏳ wait for MySQL
        await new Promise(r => setTimeout(r, 8000));

        /* -------------------- INSERT FLAG -------------------- */
        try {
            await execAsync(`
docker exec ${containerId} mysql -uroot ctf -e "
INSERT INTO users (username, password, secret) 
VALUES ('flag', 'flagpass', '${flag}');
"
`);
            console.log("✅ FLAG INSERTED");
        } catch (err) {
            console.error("❌ INSERT FAILED:", err);
        }

        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await pool.query(
            "INSERT INTO containers (user_id, container_id, port, expires_at) VALUES ($1,$2,$3,$4)",
            [userId, containerId, randomPort, expiresAt]
        );

        res.json({
            message: "Challenge started",
            url: `http://${process.env.PUBLIC_IP}:${randomPort}`,
            containerId,
            expiresAt
        });

    } catch (err) {
        console.error("Start error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/* -------------------- STOP CHALLENGE -------------------- */
exports.stopChallenge = async (req, res) => {
    try {
        const { containerId } = req.body;
        const userId = req.user.id;

        const result = await pool.query(
            "SELECT * FROM containers WHERE container_id=$1 AND user_id=$2",
            [containerId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                message: "Not allowed"
            });
        }

        await execAsync(`docker stop ${containerId}`);
        await execAsync(`docker rm ${containerId}`);

        await pool.query(
            "DELETE FROM containers WHERE container_id=$1",
            [containerId]
        );

        res.json({ message: "Stopped successfully" });

    } catch (err) {
        console.error("Stop error:", err);
        res.status(500).json({ error: "Failed to stop container" });
    }
};
