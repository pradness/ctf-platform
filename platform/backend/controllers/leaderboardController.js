const pool = require("../config/db");

exports.getLeaderboard = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.username,
                SUM(s.points)::int AS score,
                RANK() OVER (ORDER BY SUM(s.points) DESC)::int AS rank
            FROM users u
            JOIN submissions s ON u.id = s.user_id
            GROUP BY u.username
            ORDER BY score DESC
        `);

        res.json(result.rows);

    } catch (err) {
        console.error("Leaderboard error:", err);
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
};
