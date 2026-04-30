const router = require("express").Router();
const { getChallenges } = require("../controllers/challengeController");

router.get("/", getChallenges);

module.exports = router;