const pool = require("../config/db");

exports.getLeaderboard = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.username,
                COALESCE(SUM(c.points), 0) AS total_score,
                COUNT(c.id) AS solved_count
            FROM users u
            JOIN (
                SELECT DISTINCT user_id, challenge_id 
                FROM submissions
            ) s ON u.id = s.user_id
            JOIN challenges c ON s.challenge_id = c.id
            GROUP BY u.username
            ORDER BY total_score DESC
        `);

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
};
