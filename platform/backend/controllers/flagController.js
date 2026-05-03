const pool = require("../config/db");

const DEFAULT_POINTS = {
  1: 50,
  2: 75,
  3: 100
};

const STATIC_FLAGS = {
  2: ["hackme{script_kidde}", "hackme{gud_ol_eval}", "hackme{find_da_exploit}"]
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

    if (challengeIdNum === 1) {
      if (userFlagResult.rows.length === 0) {
        return res.json({ message: "Wrong flag ❌" });
      }

      const correctFlag = userFlagResult.rows[0].flag;
      isCorrect = cleanFlag === correctFlag.trim();
    } else {
      const allowedFlags = STATIC_FLAGS[challengeIdNum] || [];
      isCorrect = allowedFlags.includes(cleanFlag);
    }

    if (!isCorrect) {
      return res.json({ message: "Wrong flag ❌" });
    }

    const alreadySubmittedFlag = await pool.query(
      "SELECT 1 FROM flag_submissions WHERE user_id=$1 AND challenge_id=$2 AND submitted_flag=$3",
      [userId, challengeIdNum, cleanFlag]
    );

    if (alreadySubmittedFlag.rows.length > 0) {
      return res.json({ message: "Already submitted this flag ⚠️" });
    }

    const MULTI_FLAG_CHALLENGES = [2, 3];

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
      "INSERT INTO flag_submissions (user_id, challenge_id, submitted_flag) VALUES ($1,$2,$3)",
      [userId, challengeIdNum, cleanFlag]
    );

    await pool.query(
      "INSERT INTO submissions (user_id, challenge_id, points) VALUES ($1,$2,$3)",
      [userId, challengeIdNum, points]
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
