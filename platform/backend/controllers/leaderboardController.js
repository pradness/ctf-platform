const pool = require("../config/db");

exports.getLeaderboard = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT users.username, SUM(submissions.points) as points
            FROM submissions
            JOIN users ON users.id = submissions.user_id
            GROUP BY users.username
            ORDER BY points DESC
        `);

        const leaderboard = result.rows.map((row, index) => ({
            rank: index + 1,
            username: row.username,
            points: row.points
        }));

        res.json(leaderboard);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
};
