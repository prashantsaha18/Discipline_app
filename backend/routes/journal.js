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

// GET today's entry
router.get('/today', auth, async (req, res) => {
  try {
    const tz = await getUserTz(req.user.id);
    const today = localToday(tz);
    const result = await db.query(
      'SELECT * FROM journal_entries WHERE user_id=$1 AND entry_date=$2',
      [req.user.id, today]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET paginated journal
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 10;
    const offset = (page - 1) * limit;
    const [entries, count] = await Promise.all([
      db.query(
        `SELECT id, entry_date, content, mood, word_count, created_at
         FROM journal_entries WHERE user_id=$1
         ORDER BY entry_date DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      db.query('SELECT COUNT(*) FROM journal_entries WHERE user_id=$1', [req.user.id]),
    ]);
    res.json({
      entries: entries.rows,
      total: +count.rows[0].count,
      page,
      pages: Math.ceil(+count.rows[0].count / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST / PUT upsert today's entry
router.post('/', auth, async (req, res) => {
  try {
    const { content, mood } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const tz = await getUserTz(req.user.id);
    const today = localToday(tz);
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const result = await db.query(
      `INSERT INTO journal_entries (user_id, entry_date, content, mood, word_count)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, entry_date) DO UPDATE
       SET content=$3, mood=$4, word_count=$5, updated_at=NOW()
       RETURNING *`,
      [req.user.id, today, content.trim(), mood || null, wordCount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET journal stats
router.get('/stats', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as total_entries, SUM(word_count) as total_words,
       AVG(word_count) as avg_words, MAX(entry_date) as last_entry
       FROM journal_entries WHERE user_id=$1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
