const { exec } = require("child_process");
const util = require("util");
const crypto = require("crypto");
const pool = require("../config/db");

const execAsync = util.promisify(exec);

const MIN_CHALLENGE_PORT = Number(process.env.CHALLENGE_PORT_START || 4000);
const MAX_CHALLENGE_PORT = Number(process.env.CHALLENGE_PORT_END || 4100);
const MAX_PORT_BIND_ATTEMPTS = 12;

const pickPortInRange = () =>
    Math.floor(Math.random() * (MAX_CHALLENGE_PORT - MIN_CHALLENGE_PORT + 1)) + MIN_CHALLENGE_PORT;

const tryStartContainer = async (imageName, flag) => {
    let lastError;

    for (let attempt = 0; attempt < MAX_PORT_BIND_ATTEMPTS; attempt += 1) {
        const port = pickPortInRange();
        try {
            const { stdout } = await execAsync(
                `docker run -d -p ${port}:80 -e FLAG="${flag}" ${imageName}`
            );
            return { containerId: stdout.trim(), port };
        } catch (err) {
            const message = err.stderr || err.message || "";
            const isPortCollision = message.includes("port is already allocated") || message.includes("bind: address already in use");

            if (!isPortCollision) {
                throw err;
            }

            lastError = err;
        }
    }

    throw lastError || new Error("No available challenge ports in configured range");
};

/* -------------------- START CHALLENGE -------------------- */
exports.startChallenge = async (req, res) => {
    try {
        const userId = req.user.id;
        const challengeId = Number(req.body?.challengeId || 1);

        if (!Number.isInteger(challengeId) || challengeId <= 0) {
            return res.status(400).json({ message: "Invalid challenge id" });
        }

        const imageName = process.env.CHALLENGE_IMAGE || "custom-sqli";

        const existing = await pool.query(
            "SELECT * FROM containers WHERE user_id=$1 AND expires_at > NOW()",
            [userId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                message: "You already have an active container"
            });
        }

        // Clear stale rows so old container records don't block challenge start.
        await pool.query(
            "DELETE FROM containers WHERE user_id=$1 AND expires_at <= NOW()",
            [userId]
        );

        const flag = `FLAG{${userId}_${crypto.randomBytes(4).toString("hex")}}`;
        console.log("Generated flag:", flag);

        // Upsert the per-user challenge flag to avoid UNIQUE(user_id, challenge_id) violations.
        await pool.query(
            `INSERT INTO user_flags (user_id, challenge_id, flag)
             VALUES ($1,$2,$3)
             ON CONFLICT (user_id, challenge_id)
             DO UPDATE SET flag = EXCLUDED.flag, created_at = CURRENT_TIMESTAMP`,
            [userId, challengeId, flag]
        );

        /* -------------------- START CONTAINER -------------------- */
        const { containerId, port: mappedPort } = await tryStartContainer(imageName, flag);
        console.log("Container started:", containerId);

        console.log("✅ SQLite challenge ready");

        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await pool.query(
            "INSERT INTO containers (user_id, container_id, port, expires_at) VALUES ($1,$2,$3,$4)",
            [userId, containerId, mappedPort, expiresAt]
        );

        res.json({
            message: "Challenge started",
            url: `http://${process.env.PUBLIC_IP}:${mappedPort}`,
            containerId,
            expiresAt
        });

    } catch (err) {
        console.error("Start error:", err);

        const errorMessage = err.stderr || err.message || "Internal server error";
        if (errorMessage.includes("docker: not found")) {
            return res.status(503).json({
                error: "Docker runtime unavailable",
                message: "Challenge runtime is not configured on server. Ensure Docker CLI is installed and /var/run/docker.sock is mounted into backend service."
            });
        }

        if (errorMessage.includes("Cannot connect to the Docker daemon")) {
            return res.status(503).json({
                error: "Docker daemon unavailable",
                message: "Backend cannot reach Docker daemon. Ensure Docker service is running on host and mount /var/run/docker.sock into backend container."
            });
        }

        res.status(500).json({
            error: "Internal server error",
            message: errorMessage
        });
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
