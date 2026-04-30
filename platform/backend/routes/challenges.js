const express = require("express");
const router = express.Router();

const challenges = require("../data/challenges");

router.get("/", (req, res) => {
    const safeData = challenges.map(({ id, name, difficulty }) => ({
        id,
        name,
        difficulty
    }));

    res.json(safeData);
});

module.exports = router;