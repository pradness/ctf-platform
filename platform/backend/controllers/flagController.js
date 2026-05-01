const pool = require("../config/db");

exports.submitFlag = async (req, res) => {
    try {
        const { challengeId, flag } = req.body;
        const userId = req.user.id; // 🔥 remove fallback

        // 🔹 Get challenge difficulty (NO static flag anymore)
        const challenge = await pool.query(
            "SELECT difficulty FROM challenges WHERE id = $1",
            [challengeId]
        );

        if (challenge.rows.length === 0) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        const difficulty = challenge.rows[0].difficulty;

        // 🔹 Get dynamic flag for this user
        const flagResult = await pool.query(
            "SELECT flag FROM user_flags WHERE user_id=$1 AND challenge_id=$2",
            [userId, challengeId]
        );

        if (flagResult.rows.length === 0 || flag !== flagResult.rows[0].flag) {
            return res.json({ message: "Wrong flag ❌" });
        }

        // 🔹 Prevent duplicate submissions
        const alreadySolved = await pool.query(
            "SELECT * FROM submissions WHERE user_id=$1 AND challenge_id=$2",
            [userId, challengeId]
        );

        if (alreadySolved.rows.length > 0) {
            return res.json({ message: "Already solved ⚠️" });
        }

        // 🔹 Assign points
        let points = 10;
        if (difficulty === "medium") points = 20;
        if (difficulty === "hard") points = 30;

        // 🔹 Store submission
        await pool.query(
            "INSERT INTO submissions (user_id, challenge_id, points) VALUES ($1,$2,$3)",
            [userId, challengeId, points]
        );

        res.json({
            message: "Correct flag 🎉",
            points
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error submitting flag" });
    }
};
