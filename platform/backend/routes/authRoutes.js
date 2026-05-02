const router = require("express").Router();
const { signup, login } = require("../controllers/authController");
console.log("✅ authRoutes LOADED");
router.post("/signup", (req, res, next) => {
    console.log("🔥 /signup route HIT");
    next();
}, signup);
router.post("/login", login);

module.exports = router;
