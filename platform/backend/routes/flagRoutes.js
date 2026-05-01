const express = require("express");
const router = express.Router();

const { submitFlag } = require("../controllers/flagController");
const authMiddleware = require("../middleware/authMiddleware");

// 🔐 PROTECTED ROUTE
router.post("/", authMiddleware, submitFlag);

module.exports = router;
