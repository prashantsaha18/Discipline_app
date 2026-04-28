const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

const ALL_ACHIEVEMENTS = [
  { key: 'first_day',    title: 'First Step',          desc: 'Complete your first day',         emoji: '🌱', streak: 1 },
  { key: 'week_warrior', title: 'Week Warrior',         desc: '7 days of discipline',            emoji: '🔥', streak: 7 },
  { key: 'two_weeks',    title: 'Fortnight Strong',     desc: '14 days without breaking',        emoji: '⚡', streak: 14 },
  { key: 'one_month',    title: 'Month of Mastery',     desc: '30 days of inner control',        emoji: '🌙', streak: 30 },
  { key: 'sixty_days',   title: 'Diamond Mind',         desc: '60 days — a new identity forms',  emoji: '💎', streak: 60 },
  { key: 'ninety_days',  title: 'Brahmacharya Master',  desc: '90 days — you have transformed',  emoji: '🏆', streak: 90 },
  { key: 'first_journal',title: 'Inner Voice',          desc: 'Write your first journal entry',  emoji: '📖', streak: 0 },
  { key: 'urge_slayer',  title: 'Urge Slayer',          desc: 'Complete 5 urge mode sessions',   emoji: '🛡️', streak: 0 },
];

router.get('/', auth, async (req, res) => {
  try {
    const unlocked = await db.query(
      'SELECT achievement_key, unlocked_at, streak_at_unlock FROM achievements WHERE user_id=$1',
      [req.user.id]
    );
    const unlockedKeys = new Set(unlocked.rows.map(r => r.achievement_key));
    const result = ALL_ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlockedKeys.has(a.key),
      unlocked_at: unlocked.rows.find(r => r.achievement_key === a.key)?.unlocked_at || null,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Award a manual achievement (journal, urge_slayer etc)
router.post('/award/:key', auth, async (req, res) => {
  try {
    const validKeys = ['first_journal', 'urge_slayer'];
    if (!validKeys.includes(req.params.key)) {
      return res.status(400).json({ error: 'Invalid achievement' });
    }
    if (req.params.key === 'urge_slayer') {
      const count = await db.query(
        'SELECT COUNT(*) FROM urge_events WHERE user_id=$1 AND completed=true',
        [req.user.id]
      );
      if (+count.rows[0].count < 5) return res.status(400).json({ error: 'Not enough completed sessions' });
    }
    await db.query(
      `INSERT INTO achievements (user_id, achievement_key) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.key]
    );
    res.json({ awarded: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
