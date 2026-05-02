const pool = require("../config/db");

const pointsByDifficulty = {
    easy: 100,
    medium: 150,
    hard: 200,
};

function formatChallenge(row) {
    return {
        id: String(row.id),
        title: row.name,
        description: row.description || `Solve the ${row.name} challenge.`,
        points: pointsByDifficulty[row.difficulty] || 100,
        status: "available",
        url: row.url || null,
    };
}

exports.getChallenges = async (req, res) => {
    console.log("🔥 CONTROLLER HIT");

    try {
        const result = await pool.query(
            "SELECT id, name, description, difficulty, url FROM challenges ORDER BY id"
        );

        const challenges = result.rows.map(formatChallenge);
        const hasCustomSqli = challenges.some((challenge) => challenge.id === "custom-sqli");

        if (!hasCustomSqli) {
            challenges.push({
                id: "custom-sqli",
                title: "Custom SQL Injection",
                description: "Attack the standalone SQLi lab and extract the hidden flag.",
                points: 100,
                status: "available",
                url: process.env.CUSTOM_SQLI_URL || "http://localhost:8080",
            });
        }

        console.log("✅ RESULT:", challenges);

        return res.json(challenges);

    } catch (err) {
        console.error("❌ REAL ERROR BELOW:");
        console.error(err);

        return res.status(500).json({
            message: "Error fetching challenges",
            error: err.message
        });
    }
};
