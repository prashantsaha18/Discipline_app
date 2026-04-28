const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const router = express.Router();

const getUserTimezone = async (userId) => {
  const r = await db.query('SELECT timezone FROM users WHERE id=$1', [userId]);
  return r.rows[0]?.timezone || 'UTC';
};

const localToday = (tz) =>
  new Date().toLocaleDateString('en-CA', { timeZone: tz });

// GET /api/streaks
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM streaks WHERE user_id=$1', [req.user.id]);
    if (!result.rows.length) {
      await db.query('INSERT INTO streaks (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [req.user.id]);
      return res.json({ current_streak: 0, longest_streak: 0, total_relapses: 0, freeze_tokens: 1 });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/streaks/checkin — idempotent: safe to call multiple times per day
router.post('/checkin', auth, async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const tz = await getUserTimezone(req.user.id);
    const today = localToday(tz);

    // Idempotency: if already checked in today, return current state
    const existing = await client.query(
      "SELECT status FROM daily_logs WHERE user_id=$1 AND log_date=$2",
      [req.user.id, today]
    );
    if (existing.rows[0]?.status === 'discipline') {
      await client.query('ROLLBACK');
      const cur = await db.query('SELECT * FROM streaks WHERE user_id=$1', [req.user.id]);
      return res.json({ ...cur.rows[0], already_checked_in: true });
    }

    const streak = await client.query('SELECT * FROM streaks WHERE user_id=$1', [req.user.id]);
    const s = streak.rows[0] || { current_streak: 0, longest_streak: 0, last_check_in: null };

    const yesterdayDate = new Date(today + 'T00:00:00Z');
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const isConsecutive = s.last_check_in === yesterdayStr || s.last_check_in === today;
    const newStreak = (s.last_check_in === today) ? s.current_streak : isConsecutive ? (s.current_streak || 0) + 1 : 1;
    const newLongest = Math.max(s.longest_streak || 0, newStreak);

    await client.query(
      `UPDATE streaks SET current_streak=$1, longest_streak=$2, last_check_in=$3,
       streak_start_date=CASE WHEN $4 THEN streak_start_date ELSE $3::date END
       WHERE user_id=$5`,
      [newStreak, newLongest, today, isConsecutive && s.streak_start_date, req.user.id]
    );
    await client.query(
      `INSERT INTO daily_logs (user_id, log_date, status) VALUES ($1,$2,'discipline')
       ON CONFLICT (user_id, log_date) DO UPDATE SET status='discipline'`,
      [req.user.id, today]
    );

    // Check and award achievements
    await checkAchievements(client, req.user.id, newStreak);

    await client.query('COMMIT');
    res.json({ current_streak: newStreak, longest_streak: newLongest, total_relapses: s.total_relapses, already_checked_in: false });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkin error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/streaks/relapse
router.post('/relapse', auth, async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const tz = await getUserTimezone(req.user.id);
    const today = localToday(tz);
    const result = await client.query(
      `UPDATE streaks SET current_streak=0, last_check_in=$1,
       total_relapses=total_relapses+1, streak_start_date=NULL
       WHERE user_id=$2 RETURNING total_relapses`,
      [today, req.user.id]
    );
    await client.query(
      `INSERT INTO daily_logs (user_id, log_date, status) VALUES ($1,$2,'relapse')
       ON CONFLICT (user_id, log_date) DO UPDATE SET status='relapse'`,
      [req.user.id, today]
    );
    await client.query('COMMIT');
    res.json({ message: 'Streak reset. Rise again.', total_relapses: result.rows[0].total_relapses });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Relapse error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/streaks/freeze — use a freeze token to protect streak
router.post('/freeze', auth, async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const tz = await getUserTimezone(req.user.id);
    const today = localToday(tz);
    const s = await client.query('SELECT * FROM streaks WHERE user_id=$1', [req.user.id]);
    const streak = s.rows[0];
    if (!streak || streak.freeze_tokens < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No freeze tokens available' });
    }
    if (streak.last_freeze_date === today) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already froze today' });
    }
    await client.query(
      `UPDATE streaks SET freeze_tokens=freeze_tokens-1, last_freeze_date=$1, last_check_in=$1 WHERE user_id=$2`,
      [today, req.user.id]
    );
    await client.query(
      `INSERT INTO daily_logs (user_id, log_date, status) VALUES ($1,$2,'frozen')
       ON CONFLICT (user_id, log_date) DO UPDATE SET status='frozen'`,
      [req.user.id, today]
    );
    await client.query('COMMIT');
    res.json({ message: 'Streak frozen for today.', freeze_tokens: streak.freeze_tokens - 1 });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

async function checkAchievements(client, userId, streak) {
  const milestones = [
    { key: 'first_day', streak: 1, title: 'First Step' },
    { key: 'week_warrior', streak: 7, title: 'Week Warrior' },
    { key: 'two_weeks', streak: 14, title: 'Fortnight Strong' },
    { key: 'one_month', streak: 30, title: 'Month of Mastery' },
    { key: 'sixty_days', streak: 60, title: 'Diamond Mind' },
    { key: 'ninety_days', streak: 90, title: 'Brahmacharya Master' },
  ];
  for (const m of milestones) {
    if (streak >= m.streak) {
      await client.query(
        `INSERT INTO achievements (user_id, achievement_key, streak_at_unlock)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [userId, m.key, streak]
      );
    }
  }
}

module.exports = router;
