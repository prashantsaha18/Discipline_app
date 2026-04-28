const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Helper: local date string for a timezone
const localDate = (tz = 'UTC') => {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, display_name, timezone } = req.body;
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await db.query(
      `INSERT INTO users (username, email, password_hash, display_name, timezone)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, username, display_name, timezone`,
      [username.trim(), email.trim().toLowerCase(), hash, display_name?.trim() || username.trim(), timezone || 'UTC']
    );
    const u = user.rows[0];
    await db.query('INSERT INTO streaks (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [u.id]);
    const token = jwt.sign({ id: u.id, username: u.username }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: u.id, username: u.username, display_name: u.display_name, timezone: u.timezone } });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already taken' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await db.query('SELECT * FROM users WHERE email=$1', [email.trim().toLowerCase()]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, display_name: user.display_name, timezone: user.timezone }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, display_name, timezone, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { display_name, timezone, is_anonymous } = req.body;
    const result = await db.query(
      'UPDATE users SET display_name=COALESCE($1,display_name), timezone=COALESCE($2,timezone), is_anonymous=COALESCE($3,is_anonymous) WHERE id=$4 RETURNING id,username,display_name,timezone,is_anonymous',
      [display_name, timezone, is_anonymous, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
