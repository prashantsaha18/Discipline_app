const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [board, userRank] = await Promise.all([
      db.query(`
        SELECT
          u.display_name,
          u.is_anonymous,
          s.current_streak,
          s.longest_streak,
          s.total_relapses,
          RANK() OVER (ORDER BY s.current_streak DESC, s.longest_streak DESC) as rank
        FROM streaks s
        JOIN users u ON u.id = s.user_id
        WHERE s.current_streak > 0
        ORDER BY rank
        LIMIT 20
      `),
      db.query(`
        SELECT rank FROM (
          SELECT user_id,
            RANK() OVER (ORDER BY current_streak DESC, longest_streak DESC) as rank
          FROM streaks WHERE current_streak > 0
        ) r WHERE user_id=$1
      `, [req.user.id]),
    ]);

    res.json({
      board: board.rows.map(r => ({
        rank: +r.rank,
        display_name: r.is_anonymous ? 'Anonymous Warrior' : r.display_name,
        current_streak: r.current_streak,
        longest_streak: r.longest_streak,
      })),
      your_rank: userRank.rows[0]?.rank ? +userRank.rows[0].rank : null,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
