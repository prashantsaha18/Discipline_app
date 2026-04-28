const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

const VALID_MOODS = ['peaceful','anxious','bored','stressed','focused','tired','angry','grateful'];
const VALID_TRIGGERS = ['boredom','stress','loneliness','fatigue','social_media','night','none','relationship','work'];

router.post('/', auth, async (req, res) => {
  try {
    const { mood, trigger_type, context, intensity } = req.body;
    if (mood && !VALID_MOODS.includes(mood)) return res.status(400).json({ error: 'Invalid mood' });
    if (trigger_type && !VALID_TRIGGERS.includes(trigger_type)) return res.status(400).json({ error: 'Invalid trigger' });
    await db.query(
      'INSERT INTO awareness_logs (user_id, mood, trigger_type, context, intensity) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, mood || null, trigger_type || null, context || null, intensity || null]
    );
    res.json({ message: 'Awareness logged' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/recent', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM awareness_logs WHERE user_id=$1 ORDER BY logged_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
