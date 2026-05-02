const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

// 🔥 IMPORTANT: correct import
const {
    startChallenge,
    stopChallenge
} = require("../controllers/containerController");

// START challenge
router.post("/start", authMiddleware, startChallenge);

// STOP challenge
router.post("/stop", authMiddleware, stopChallenge);

module.exports = router;
