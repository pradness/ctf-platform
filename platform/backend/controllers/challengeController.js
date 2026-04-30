const pool = require("../config/db");

exports.getChallenges = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, difficulty FROM challenges"
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching challenges" });
    }
};