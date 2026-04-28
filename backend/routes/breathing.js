const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

const TECHNIQUES = {
  '4-7-8':   { inhale: 4, hold: 7, exhale: 8, label: '4-7-8 Relaxing' },
  'box':     { inhale: 4, hold: 4, exhale: 4, holdOut: 4, label: 'Box Breathing' },
  '4-4-6':   { inhale: 4, hold: 4, exhale: 6, label: '4-4-6 Calm' },
  'coherent':{ inhale: 5, hold: 0, exhale: 5, label: 'Coherent (5-5)' },
};

router.get('/techniques', auth, (req, res) => {
  res.json(Object.entries(TECHNIQUES).map(([id, t]) => ({ id, ...t })));
});

router.post('/session', auth, async (req, res) => {
  try {
    const { technique, cycles_completed, duration_seconds } = req.body;
    if (!TECHNIQUES[technique]) return res.status(400).json({ error: 'Invalid technique' });
    const result = await db.query(
      `INSERT INTO breathing_sessions (user_id, technique, cycles_completed, duration_seconds)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [req.user.id, technique, cycles_completed || 0, duration_seconds || 0]
    );
    res.json({ session_id: result.rows[0].id, message: 'Session recorded' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as total_sessions, SUM(duration_seconds) as total_seconds,
       SUM(cycles_completed) as total_cycles, technique,
       COUNT(*) FILTER (WHERE started_at >= NOW()-INTERVAL '7 days') as this_week
       FROM breathing_sessions WHERE user_id=$1
       GROUP BY technique ORDER BY COUNT(*) DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
