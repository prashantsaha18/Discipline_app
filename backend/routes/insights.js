const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const [urgeByHour, topTriggers, moodFreq, weeklyPattern, urgeStats] = await Promise.all([
      db.query(
        `SELECT EXTRACT(HOUR FROM triggered_at) as hour, COUNT(*) as count
         FROM urge_events WHERE user_id=$1
         GROUP BY hour ORDER BY hour`,
        [uid]
      ),
      db.query(
        `SELECT trigger_type, COUNT(*) as count
         FROM urge_events WHERE user_id=$1 AND trigger_type IS NOT NULL
         GROUP BY trigger_type ORDER BY count DESC LIMIT 5`,
        [uid]
      ),
      db.query(
        `SELECT mood, COUNT(*) as count FROM awareness_logs WHERE user_id=$1
         GROUP BY mood ORDER BY count DESC`,
        [uid]
      ),
      db.query(
        `SELECT EXTRACT(DOW FROM log_date) as dow, status, COUNT(*) as count
         FROM daily_logs WHERE user_id=$1 AND log_date >= CURRENT_DATE - 90
         GROUP BY dow, status ORDER BY dow`,
        [uid]
      ),
      db.query(
        `SELECT COUNT(*) as total_urges,
         COUNT(*) FILTER (WHERE completed) as survived,
         AVG(duration_seconds) FILTER (WHERE completed) as avg_duration
         FROM urge_events WHERE user_id=$1`,
        [uid]
      ),
    ]);

    const hourRows = urgeByHour.rows;
    const peakHour = hourRows.length
      ? hourRows.reduce((a, b) => (+a.count > +b.count ? a : b))
      : null;

    let insight = 'Keep logging daily to unlock your personal insights.';
    if (peakHour && +peakHour.count > 0) {
      const h = +peakHour.hour;
      const label = h === 0 ? 'midnight' : h < 12 ? `${h}am` : h === 12 ? 'noon' : `${h - 12}pm`;
      insight = `Most urges appear around ${label}. Plan something intentional at that time.`;
    }

    res.json({
      insight,
      urge_by_hour: urgeByHour.rows,
      top_triggers: topTriggers.rows,
      mood_frequency: moodFreq.rows,
      weekly_pattern: weeklyPattern.rows,
      urge_stats: urgeStats.rows[0],
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
