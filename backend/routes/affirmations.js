const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

const DEFAULT_AFFIRMATIONS = [
  { text: "I am stronger than my urges.", category: "strength" },
  { text: "Every second I resist, I become more powerful.", category: "strength" },
  { text: "My body and mind are under my command.", category: "control" },
  { text: "I am becoming the best version of myself.", category: "growth" },
  { text: "This urge will pass. It always does.", category: "resilience" },
  { text: "I choose freedom over temporary pleasure.", category: "freedom" },
];

// GET all affirmations (user's + defaults seeded)
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM affirmations WHERE user_id=$1 AND is_active=true ORDER BY created_at ASC',
      [req.user.id]
    );
    // Seed defaults if none exist
    if (result.rows.length === 0) {
      // Build correct parameterized multi-row INSERT: each row has 4 params
      // params layout: [userId, text1, cat1, show1, text2, cat2, show2, ...]
      const valuePlaceholders = DEFAULT_AFFIRMATIONS.map((_, i) =>
        `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`
      ).join(', ');
      const params = [req.user.id, ...DEFAULT_AFFIRMATIONS.flatMap(a => [a.text, a.category, true])];
      await db.query(
        `INSERT INTO affirmations (user_id, text, category, show_in_urge) VALUES ${valuePlaceholders} ON CONFLICT DO NOTHING`,
        params
      );
      const fresh = await db.query('SELECT * FROM affirmations WHERE user_id=$1 AND is_active=true ORDER BY created_at ASC', [req.user.id]);
      return res.json(fresh.rows);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET random affirmation for urge mode
router.get('/random', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM affirmations WHERE user_id=$1 AND is_active=true AND show_in_urge=true ORDER BY RANDOM() LIMIT 1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create affirmation
router.post('/', auth, async (req, res) => {
  try {
    const { text, category, show_in_urge } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });
    if (text.trim().length > 200) return res.status(400).json({ error: 'Max 200 characters' });
    const result = await db.query(
      'INSERT INTO affirmations (user_id, text, category, show_in_urge) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, text.trim(), category || 'general', show_in_urge !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE (archive)
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('UPDATE affirmations SET is_active=false WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
