const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

// GET /api/reports/weekly — full weekly summary
router.get('/weekly', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const [
      streakData, weekLogs, urgeStats, habitStats,
      moodStats, sleepStats, ritualStats
    ] = await Promise.all([
      db.query('SELECT current_streak, longest_streak, total_relapses FROM streaks WHERE user_id=$1', [uid]),
      db.query(
        `SELECT log_date, status, morning_ritual_done, night_reflection_done
         FROM daily_logs WHERE user_id=$1 AND log_date >= CURRENT_DATE - 7 ORDER BY log_date`,
        [uid]
      ),
      db.query(
        `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE completed) as survived,
         COUNT(*) FILTER (WHERE triggered_at >= NOW()-INTERVAL '7 days') as this_week,
         mode() WITHIN GROUP (ORDER BY trigger_type) as top_trigger
         FROM urge_events WHERE user_id=$1`,
        [uid]
      ),
      db.query(
        `SELECT h.name, h.emoji, h.color,
         COUNT(hl.id) FILTER (WHERE hl.completed AND hl.log_date >= CURRENT_DATE-7) as done_this_week,
         COUNT(hl.id) FILTER (WHERE hl.log_date >= CURRENT_DATE-7) as logged_this_week
         FROM habits h LEFT JOIN habit_logs hl ON hl.habit_id=h.id
         WHERE h.user_id=$1 AND h.is_active=true GROUP BY h.id ORDER BY done_this_week DESC`,
        [uid]
      ),
      db.query(
        `SELECT mood, COUNT(*) as count FROM awareness_logs
         WHERE user_id=$1 AND logged_at >= NOW()-INTERVAL '7 days'
         GROUP BY mood ORDER BY count DESC LIMIT 3`,
        [uid]
      ),
      db.query(
        `SELECT AVG(quality) as avg_quality, AVG(duration_hours) as avg_hours, COUNT(*) as nights
         FROM sleep_logs WHERE user_id=$1 AND log_date >= CURRENT_DATE-7`,
        [uid]
      ),
      db.query(
        `SELECT
         COUNT(*) FILTER (WHERE morning_ritual_done) as mornings_done,
         COUNT(*) FILTER (WHERE night_reflection_done) as nights_done,
         COUNT(*) as total_days
         FROM daily_logs WHERE user_id=$1 AND log_date >= CURRENT_DATE-7`,
        [uid]
      ),
    ]);

    const disciplineDays = weekLogs.rows.filter(r => r.status === 'discipline').length;
    const successRate = weekLogs.rows.length
      ? Math.round((disciplineDays / weekLogs.rows.length) * 100) : 0;

    res.json({
      period: 'last_7_days',
      streak: streakData.rows[0] || {},
      success_rate: successRate,
      discipline_days: disciplineDays,
      total_days_logged: weekLogs.rows.length,
      daily_logs: weekLogs.rows,
      urge_stats: urgeStats.rows[0],
      habit_stats: habitStats.rows,
      top_moods: moodStats.rows,
      sleep_stats: sleepStats.rows[0],
      ritual_stats: ritualStats.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reports/milestones — which milestone days to celebrate
router.get('/milestones', auth, async (req, res) => {
  try {
    const MILESTONES = [1, 3, 7, 14, 21, 30, 45, 60, 75, 90, 120, 180, 365];
    const [streak, shown] = await Promise.all([
      db.query('SELECT current_streak FROM streaks WHERE user_id=$1', [req.user.id]),
      db.query('SELECT streak_day FROM milestone_logs WHERE user_id=$1', [req.user.id]),
    ]);
    const current = streak.rows[0]?.current_streak || 0;
    const shownDays = new Set(shown.rows.map(r => r.streak_day));
    const pending = MILESTONES.filter(m => m <= current && !shownDays.has(m));
    res.json({ current_streak: current, pending_milestones: pending });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reports/milestones/mark — mark milestone as shown
router.post('/milestones/mark', auth, async (req, res) => {
  try {
    const { streak_day } = req.body;
    if (!streak_day) return res.status(400).json({ error: 'streak_day required' });
    await db.query(
      'INSERT INTO milestone_logs (user_id, streak_day) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, streak_day]
    );
    res.json({ marked: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
