const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

const localToday = (tz = 'UTC') => new Date().toLocaleDateString('en-CA', { timeZone: tz });
const getUserTz = async (id) => {
  const r = await db.query('SELECT timezone FROM users WHERE id=$1', [id]);
  return r.rows[0]?.timezone || 'UTC';
};

// GET all habits with today's log + streak
router.get('/', auth, async (req, res) => {
  try {
    const tz = await getUserTz(req.user.id);
    const today = localToday(tz);
    const result = await db.query(
      `SELECT h.*, hl.completed as logged_today,
       COALESCE(hs.current_streak, 0) as current_streak,
       COALESCE(hs.longest_streak, 0) as longest_streak
       FROM habits h
       LEFT JOIN habit_logs hl ON hl.habit_id=h.id AND hl.log_date=$2
       LEFT JOIN habit_streaks hs ON hs.habit_id=h.id
       WHERE h.user_id=$1 AND h.is_active=true
       ORDER BY h.sort_order, h.created_at`,
      [req.user.id, today]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST create habit
router.post('/', auth, async (req, res) => {
  try {
    const { name, emoji, color, target_days } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const result = await db.query(
      'INSERT INTO habits (user_id, name, emoji, color, target_days) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, name.trim(), emoji || '◎', color || 'green', target_days || 7]
    );
    const habit = result.rows[0];
    await db.query('INSERT INTO habit_streaks (habit_id) VALUES ($1) ON CONFLICT DO NOTHING', [habit.id]);
    res.status(201).json({ ...habit, current_streak: 0, longest_streak: 0 });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PUT update habit
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, emoji, color, is_active, sort_order } = req.body;
    const result = await db.query(
      `UPDATE habits SET name=COALESCE($1,name), emoji=COALESCE($2,emoji),
       color=COALESCE($3,color), is_active=COALESCE($4,is_active),
       sort_order=COALESCE($5,sort_order)
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [name, emoji, color, is_active, sort_order, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE (archive)
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('UPDATE habits SET is_active=false WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Archived' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST toggle today + update streak
router.post('/:id/toggle', auth, async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const tz = await getUserTz(req.user.id);
    const today = localToday(tz);

    const existing = await client.query(
      'SELECT * FROM habit_logs WHERE habit_id=$1 AND log_date=$2',
      [req.params.id, today]
    );
    let completed;
    if (existing.rows.length) {
      completed = !existing.rows[0].completed;
      await client.query('UPDATE habit_logs SET completed=$1, logged_at=NOW() WHERE habit_id=$2 AND log_date=$3',
        [completed, req.params.id, today]);
    } else {
      completed = true;
      await client.query(
        'INSERT INTO habit_logs (habit_id, user_id, log_date, completed) VALUES ($1,$2,$3,$4)',
        [req.params.id, req.user.id, today, true]
      );
    }

    // Recalculate streak if marking complete
    if (completed) {
      const yesterdayDate = new Date(today + 'T00:00:00Z');
      yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
      const yStr = yesterdayDate.toISOString().slice(0, 10);

      const hs = await client.query('SELECT * FROM habit_streaks WHERE habit_id=$1', [req.params.id]);
      const s = hs.rows[0] || { current_streak: 0, longest_streak: 0, last_logged: null };
      const isConsec = s.last_logged === yStr || s.last_logged === today;
      const newStreak = (s.last_logged === today) ? s.current_streak : isConsec ? s.current_streak + 1 : 1;
      const newLongest = Math.max(s.longest_streak || 0, newStreak);
      await client.query(
        `INSERT INTO habit_streaks (habit_id, current_streak, longest_streak, last_logged)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (habit_id) DO UPDATE SET current_streak=$2, longest_streak=$3, last_logged=$4, updated_at=NOW()`,
        [req.params.id, newStreak, newLongest, today]
      );
      await client.query('COMMIT');
      return res.json({ completed, date: today, current_streak: newStreak, longest_streak: newLongest });
    } else {
      // Reset streak on untoggle
      await client.query(
        'UPDATE habit_streaks SET current_streak=GREATEST(current_streak-1,0), last_logged=NULL WHERE habit_id=$1',
        [req.params.id]
      );
    }
    await client.query('COMMIT');
    res.json({ completed, date: today });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

// GET habit history + streak calendar
router.get('/:id/history', auth, async (req, res) => {
  try {
    const [logs, streak] = await Promise.all([
      db.query(
        `SELECT log_date, completed FROM habit_logs
         WHERE habit_id=$1 AND user_id=$2 AND log_date >= CURRENT_DATE-30
         ORDER BY log_date DESC`,
        [req.params.id, req.user.id]
      ),
      db.query('SELECT * FROM habit_streaks WHERE habit_id=$1', [req.params.id]),
    ]);
    res.json({ logs: logs.rows, streak: streak.rows[0] || {} });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
