const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

router.get('/active', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, message, created_at FROM future_messages WHERE user_id=$1 AND is_active=true ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/all', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, message, created_at, is_active FROM future_messages WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
    if (message.trim().length > 500) return res.status(400).json({ error: 'Message too long (max 500 chars)' });
    await db.query('UPDATE future_messages SET is_active=false WHERE user_id=$1', [req.user.id]);
    const result = await db.query(
      'INSERT INTO future_messages (user_id, message) VALUES ($1,$2) RETURNING *',
      [req.user.id, message.trim()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM future_messages WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
