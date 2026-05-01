const pool = require("../config/db");

exports.getChallenges = async (req, res) => {
    console.log("🔥 CONTROLLER HIT");

    try {
        const result = await pool.query(
            "SELECT id, name, difficulty, url FROM challenges"
        );

        console.log("✅ RESULT:", result.rows);

        return res.json(result.rows);

    } catch (err) {
        console.error("❌ REAL ERROR BELOW:");
        console.error(err);   // 🔥 THIS IS THE KEY

        return res.status(500).json({
            message: "Error fetching challenges",
            error: err.message
        });
    }
};
