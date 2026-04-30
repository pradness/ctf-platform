const pool = require("../config/db");

exports.submitFlag = async (req, res) => {
    try {
        const { challengeId, flag } = req.body;

        // ✅ validation
        if (!challengeId || !flag) {
            return res.status(400).json({ message: "challengeId and flag required" });
        }

        // get challenge
        const result = await pool.query(
            "SELECT * FROM challenges WHERE id=$1",
            [challengeId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        const challenge = result.rows[0];

        const correct = challenge.flag === flag;

        if (correct) {
            // check duplicate submission
            const existing = await pool.query(
                "SELECT 1 FROM submissions WHERE user_id=$1 AND challenge_id=$2",
                [req.user.id, challengeId]
            );

            if (existing.rows.length > 0) {
                return res.json({
                    success: false,
                    message: "Already solved ⚠️"
                });
            }

            await pool.query(
                "INSERT INTO submissions (user_id, challenge_id, points) VALUES ($1, $2, $3)",
                [req.user.id, challengeId, 10]
            );
        }

        res.json({
            success: correct,
            message: correct ? "Correct 🎉" : "Wrong ❌"
        });

    } catch (err) {
        console.error("FLAG ERROR:", err);
        res.status(500).json({ message: "Error submitting flag" });
    }
};