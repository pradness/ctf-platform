const pool = require("../config/db");

const DEFAULT_POINTS = {
  1: 50,
  2: 75,
  3: 100
};

exports.submitFlag = async (req, res) => {
  try {
    const { challengeId, flag } = req.body;

    if (!challengeId || !flag) {
      return res.status(400).json({ message: "Missing challengeId or flag" });
    }

    const userId = req.user.id;
    const challengeIdNum = Number(challengeId);
    const cleanFlag = flag.trim();
    const points = DEFAULT_POINTS[challengeIdNum] || 10;

    // Check for a user-specific dynamic flag first (SQLi container challenge)
    const userFlagResult = await pool.query(
      "SELECT flag FROM user_flags WHERE user_id=$1 AND challenge_id=$2",
      [userId, challengeIdNum]
    );

    let isCorrect = false;

    if (userFlagResult.rows.length > 0) {
      const correctFlag = userFlagResult.rows[0].flag;
      isCorrect = cleanFlag === correctFlag.trim();
    } else {
      // Static challenge fallback. If the DB has a flag column, use it; otherwise use code defaults.
      const staticFlagResult = await pool.query(
        "SELECT flag FROM challenges WHERE id = $1",
        [challengeIdNum]
      );

      const dbFlag = staticFlagResult.rows[0]?.flag;
      const allowedFlags = dbFlag
        ? dbFlag.split(",").map((value) => value.trim())
        : challengeIdNum === 3
          ? ["FLAG{friend1}", "FLAG{friend2}", "FLAG{friend3}"]
          : [];

      isCorrect = allowedFlags.includes(cleanFlag);
    }

    if (!isCorrect) {
      return res.json({ message: "Wrong flag ❌" });
    }

    const alreadySameFlag = await pool.query(
      "SELECT 1 FROM submissions WHERE user_id=$1 AND challenge_id=$2 AND flag=$3",
      [userId, challengeIdNum, cleanFlag]
    );

    if (alreadySameFlag.rows.length > 0) {
      return res.json({ message: "Already submitted this flag ⚠️" });
    }

    const MULTI_FLAG_CHALLENGES = [3];

    if (!MULTI_FLAG_CHALLENGES.includes(challengeIdNum)) {
      const alreadySolved = await pool.query(
        "SELECT 1 FROM submissions WHERE user_id=$1 AND challenge_id=$2",
        [userId, challengeIdNum]
      );

      if (alreadySolved.rows.length > 0) {
        return res.json({ message: "Already solved ⚠️" });
      }
    } else {
      const count = await pool.query(
        "SELECT COUNT(*) FROM submissions WHERE user_id=$1 AND challenge_id=$2",
        [userId, challengeIdNum]
      );

      if (parseInt(count.rows[0].count, 10) >= 3) {
        return res.json({ message: "Max 3 flags allowed ⚠️" });
      }
    }

    await pool.query(
      "INSERT INTO submissions (user_id, challenge_id, flag, points) VALUES ($1,$2,$3,$4)",
      [userId, challengeIdNum, cleanFlag, points]
    );

    return res.json({
      message: "Correct flag 🎉",
      points
    });
  } catch (err) {
    console.error("Flag submission error:", err);
    return res.status(500).json({ message: "Error submitting flag" });
  }
};
