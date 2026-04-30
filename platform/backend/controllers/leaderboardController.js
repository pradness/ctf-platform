const pool = require("../config/db");

exports.getLeaderboard = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT user_id, SUM(points) as score
            FROM submissions
            GROUP BY user_id
            ORDER BY score DESC
        `);

        const formatted = result.rows.map(row => ({
            userId: row.user_id,
            score: Number(row.score)
        }));

        res.json({
            success: true,
            data: formatted
        });

    } catch (err) {
        console.error("LEADERBOARD ERROR:", err);
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
};