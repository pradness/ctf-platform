const pool = require("../config/db");

exports.submitFlag = async (req, res) => {
try {
const { challengeId, flag } = req.body;

if (!challengeId || !flag) {
return res.status(400).json({ message: "Missing challengeId or flag" });
}

const userId = req.user.id;
const challengeIdNum = Number(challengeId);
const cleanFlag = flag.trim();

// 🔹 Get challenge
const challengeResult = await pool.query(
"SELECT flag, points FROM challenges WHERE id = $1",
[challengeIdNum]
);

if (challengeResult.rows.length === 0) {
return res.status(404).json({ message: "Challenge not found" });
}

const challenge = challengeResult.rows[0];

let isCorrect = false;

// 🔥 CHECK DYNAMIC FLAG (for SQLi)
const userFlagResult = await pool.query(
"SELECT flag FROM user_flags WHERE user_id=$1 AND challenge_id=$2",
[userId, challengeIdNum]
);

if (userFlagResult.rows.length > 0) {
const correctFlag = userFlagResult.rows[0].flag;
if (cleanFlag === correctFlag.trim()) {
isCorrect = true;
}
} else {
// 🔥 STATIC MULTI-FLAG (friend challenge)
const validFlags = challenge.flag
? challenge.flag.split(",").map(f => f.trim())
: [];

if (validFlags.includes(cleanFlag)) {
isCorrect = true;
}
}

if (!isCorrect) {
return res.json({ message: "Wrong flag ❌" });
}

// 🔥 Prevent SAME FLAG reuse
const alreadySameFlag = await pool.query(
"SELECT * FROM submissions WHERE user_id=$1 AND challenge_id=$2 AND flag=$3",
[userId, challengeIdNum, cleanFlag]
);

if (alreadySameFlag.rows.length > 0) {
return res.json({ message: "Already submitted this flag ⚠️" });
}

// 🔥 LIMIT: ONLY friend challenge can be submitted 3 times
const FRIEND_CHALLENGE_ID = 3; // 🔴 change if needed

if (challengeIdNum !== FRIEND_CHALLENGE_ID) {
// normal challenges → only 1 submission
const alreadySolved = await pool.query(
"SELECT * FROM submissions WHERE user_id=$1 AND challenge_id=$2",
[userId, challengeIdNum]
);

if (alreadySolved.rows.length > 0) {
return res.json({ message: "Already solved ⚠️" });
}
} else {
// friend challenge → max 3 submissions
const count = await pool.query(
"SELECT COUNT(*) FROM submissions WHERE user_id=$1 AND challenge_id=$2",
[userId, challengeIdNum]
);

if (parseInt(count.rows[0].count) >= 3) {
return res.json({ message: "Max 3 flags allowed ⚠️" });
}
}

const points = challenge.points || 10;

await pool.query(
"INSERT INTO submissions (user_id, challenge_id, points, flag) VALUES ($1,$2,$3,$4)",
[userId, challengeIdNum, points, cleanFlag]
);

return res.json({
message: "Correct flag 🎉",
points
});

} catch (err) {
console.error(err);
return res.status(500).json({ message: "Error submitting flag" });
}
};
