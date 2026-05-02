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

        const leaderboard = result.rows.map((row, index) => ({
            rank: index + 1,
            username: row.username,
            points: row.points
        }));

        res.json(leaderboard);

    } catch (err) {
        console.error("Leaderboard error:", err);
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
};
