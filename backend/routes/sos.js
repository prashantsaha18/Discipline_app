const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

// POST start SOS session
router.post('/start', auth, async (req, res) => {
  try {
    const result = await db.query(
      'INSERT INTO sos_sessions (user_id) VALUES ($1) RETURNING id, started_at',
      [req.user.id]
    );
    res.json({ session_id: result.rows[0].id });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PUT complete SOS session
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const { duration_seconds, techniques_used } = req.body;
    await db.query(
      'UPDATE sos_sessions SET completed=true, duration_seconds=$1, techniques_used=$2 WHERE id=$3 AND user_id=$4',
      [duration_seconds || 0, techniques_used || [], req.params.id, req.user.id]
    );
    res.json({ message: 'SOS session complete. You made it.' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET SOS history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM sos_sessions WHERE user_id=$1 ORDER BY started_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
