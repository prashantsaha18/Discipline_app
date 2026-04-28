const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

router.post('/start', auth, async (req, res) => {
  try {
    const { mood, trigger_type } = req.body;
    const result = await db.query(
      'INSERT INTO urge_events (user_id, mood, trigger_type) VALUES ($1,$2,$3) RETURNING id, triggered_at',
      [req.user.id, mood || null, trigger_type || null]
    );
    res.json({ urge_id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/complete', auth, async (req, res) => {
  try {
    const { duration_seconds, action_taken, notes } = req.body;
    const result = await db.query(
      `UPDATE urge_events SET completed=true, duration_seconds=$1, action_taken=$2, notes=$3
       WHERE id=$4 AND user_id=$5 RETURNING id`,
      [duration_seconds || 0, action_taken || null, notes || null, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Well done. The urge passed.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const result = await db.query(
      'SELECT * FROM urge_events WHERE user_id=$1 ORDER BY triggered_at DESC LIMIT $2',
      [req.user.id, limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE completed) as completed,
       AVG(duration_seconds) FILTER (WHERE completed) as avg_duration
       FROM urge_events WHERE user_id=$1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
