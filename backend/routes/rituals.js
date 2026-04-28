const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

const localToday = (tz = 'UTC') =>
  new Date().toLocaleDateString('en-CA', { timeZone: tz });

const getUserTz = async (id) => {
  const r = await db.query('SELECT timezone FROM users WHERE id=$1', [id]);
  return r.rows[0]?.timezone || 'UTC';
};

// GET today's ritual status
router.get('/today', auth, async (req, res) => {
  try {
    const tz = await getUserTz(req.user.id);
    const today = localToday(tz);
    const [morning, night] = await Promise.all([
      db.query('SELECT * FROM morning_rituals WHERE user_id=$1 AND ritual_date=$2', [req.user.id, today]),
      db.query('SELECT * FROM night_reflections WHERE user_id=$1 AND reflection_date=$2', [req.user.id, today]),
    ]);
    res.json({
      morning: morning.rows[0] || null,
      night: night.rows[0] || null,
      date: today
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/rituals/morning
router.post('/morning', auth, async (req, res) => {
  try {
    const { confirmed_awake, drank_water, did_breathing } = req.body;
    const tz = await getUserTz(req.user.id);
    const today = localToday(tz);
    const completed = confirmed_awake && drank_water && did_breathing;
    const result = await db.query(
      `INSERT INTO morning_rituals (user_id, ritual_date, confirmed_awake, drank_water, did_breathing, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id, ritual_date) DO UPDATE
       SET confirmed_awake=$3, drank_water=$4, did_breathing=$5, completed_at=$6
       RETURNING *`,
      [req.user.id, today, !!confirmed_awake, !!drank_water, !!did_breathing, completed ? new Date() : null]
    );
    if (completed) {
      await db.query(
        `UPDATE daily_logs SET morning_ritual_done=true WHERE user_id=$1 AND log_date=$2`,
        [req.user.id, today]
      );
    }
    res.json({ message: completed ? 'Morning ritual complete!' : 'Progress saved', completed, ritual: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/rituals/night
router.post('/night', auth, async (req, res) => {
  try {
    const { trigger_description, response_description, overall_rating } = req.body;
    if (!trigger_description && !response_description) {
      return res.status(400).json({ error: 'At least one field required' });
    }
    const tz = await getUserTz(req.user.id);
    const today = localToday(tz);
    const result = await db.query(
      `INSERT INTO night_reflections (user_id, reflection_date, trigger_description, response_description, overall_rating, completed_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (user_id, reflection_date) DO UPDATE
       SET trigger_description=$3, response_description=$4, overall_rating=$5, completed_at=NOW()
       RETURNING *`,
      [req.user.id, today, trigger_description || '', response_description || '', overall_rating || null]
    );
    await db.query(
      `UPDATE daily_logs SET night_reflection_done=true WHERE user_id=$1 AND log_date=$2`,
      [req.user.id, today]
    );
    res.json({ message: 'Night reflection saved', reflection: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
