const express = require("express");
const router = express.Router();

const challenges = require("../data/challenges");

router.post("/", (req, res) => {
    const { challengeId, flag } = req.body;

    const challenge = challenges.find(c => c.id == challengeId);

    if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
    }

    if (challenge.flag === flag) {
        return res.json({
            success: true,
            message: "Correct flag! 🎉"
        });
    } else {
        return res.json({
            success: false,
            message: "Wrong flag ❌"
        });
    }
});

module.exports = router;