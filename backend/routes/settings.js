const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

const DEFAULTS = {
  urge_timer_minutes: 10,
  theme_intensity: 'standard',
  show_streak_on_lock: true,
  daily_reminder_hour: 21,
  quote_category: 'all',
};

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM user_settings WHERE user_id=$1', [req.user.id]);
    if (!result.rows.length) {
      await db.query(
        `INSERT INTO user_settings (user_id, urge_timer_minutes, theme_intensity, daily_reminder_hour, quote_category)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [req.user.id, 10, 'standard', 21, 'all']
      );
      return res.json({ user_id: req.user.id, ...DEFAULTS });
    }
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/', auth, async (req, res) => {
  try {
    const { urge_timer_minutes, theme_intensity, show_streak_on_lock, daily_reminder_hour, quote_category } = req.body;
    // Validate
    if (urge_timer_minutes !== undefined && (urge_timer_minutes < 1 || urge_timer_minutes > 60)) {
      return res.status(400).json({ error: 'urge_timer_minutes must be 1-60' });
    }
    const result = await db.query(
      `INSERT INTO user_settings (user_id, urge_timer_minutes, theme_intensity, show_streak_on_lock, daily_reminder_hour, quote_category)
       VALUES ($1, COALESCE($2,10), COALESCE($3,'standard'), COALESCE($4,true), COALESCE($5,21), COALESCE($6,'all'))
       ON CONFLICT (user_id) DO UPDATE
       SET urge_timer_minutes=COALESCE($2, user_settings.urge_timer_minutes),
           theme_intensity=COALESCE($3, user_settings.theme_intensity),
           show_streak_on_lock=COALESCE($4, user_settings.show_streak_on_lock),
           daily_reminder_hour=COALESCE($5, user_settings.daily_reminder_hour),
           quote_category=COALESCE($6, user_settings.quote_category),
           updated_at=NOW()
       RETURNING *`,
      [req.user.id, urge_timer_minutes, theme_intensity, show_streak_on_lock, daily_reminder_hour, quote_category]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
