const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const months = Math.min(Math.max(parseInt(req.query.months) || 6, 1), 12);
    const result = await db.query(
      `SELECT log_date, status, morning_ritual_done, night_reflection_done
       FROM daily_logs WHERE user_id=$1 AND log_date >= CURRENT_DATE - ($2 * 30)::integer
       ORDER BY log_date DESC`,
      [req.user.id, months]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
