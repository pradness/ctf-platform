const pool = require("../config/db");

exports.getLeaderboard = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT users.username, SUM(submissions.points) as score
            FROM submissions
            JOIN users ON users.id = submissions.user_id
            GROUP BY users.username
            ORDER BY score DESC
        `);

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
};
