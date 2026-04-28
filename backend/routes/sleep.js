const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

const localToday = (tz = 'UTC') => new Date().toLocaleDateString('en-CA', { timeZone: tz });
const getUserTz = async (id) => {
  const r = await db.query('SELECT timezone FROM users WHERE id=$1', [id]);
  return r.rows[0]?.timezone || 'UTC';
};

// GET today's sleep log
router.get('/today', auth, async (req, res) => {
  try {
    const tz = await getUserTz(req.user.id);
    const today = localToday(tz);
    const result = await db.query('SELECT * FROM sleep_logs WHERE user_id=$1 AND log_date=$2', [req.user.id, today]);
    res.json(result.rows[0] || null);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET last 30 days
router.get('/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM sleep_logs WHERE user_id=$1 AND log_date >= CURRENT_DATE-30 ORDER BY log_date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST upsert sleep log
router.post('/', auth, async (req, res) => {
  try {
    const { bedtime, wake_time, duration_hours, quality, notes, log_date } = req.body;
    if (!quality) return res.status(400).json({ error: 'Quality rating required' });
    const tz = await getUserTz(req.user.id);
    const date = log_date || localToday(tz);
    const result = await db.query(
      `INSERT INTO sleep_logs (user_id, log_date, bedtime, wake_time, duration_hours, quality, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id, log_date) DO UPDATE
       SET bedtime=$3, wake_time=$4, duration_hours=$5, quality=$6, notes=$7
       RETURNING *`,
      [req.user.id, date, bedtime || null, wake_time || null, duration_hours || null, quality, notes || null]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET sleep stats
router.get('/stats', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT AVG(quality) as avg_quality, AVG(duration_hours) as avg_hours,
       COUNT(*) as total_logs,
       COUNT(*) FILTER (WHERE quality >= 4) as good_nights
       FROM sleep_logs WHERE user_id=$1 AND log_date >= CURRENT_DATE-30`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
