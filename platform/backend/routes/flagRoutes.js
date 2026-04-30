const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { submitFlag } = require("../controllers/flagController");

router.post("/", auth, submitFlag);

module.exports = router;