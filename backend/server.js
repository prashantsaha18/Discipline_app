require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true });
app.use('/api/', limiter);
app.use(express.json({ limit: '10kb' }));

// All routes
const routes = {
  '/api/auth':         require('./routes/auth'),
  '/api/streaks':      require('./routes/streaks'),
  '/api/calendar':     require('./routes/calendar'),
  '/api/urge':         require('./routes/urge'),
  '/api/awareness':    require('./routes/awareness'),
  '/api/rituals':      require('./routes/rituals'),
  '/api/messages':     require('./routes/messages'),
  '/api/insights':     require('./routes/insights'),
  '/api/leaderboard':  require('./routes/leaderboard'),
  '/api/habits':       require('./routes/habits'),
  '/api/journal':      require('./routes/journal'),
  '/api/achievements': require('./routes/achievements'),
  '/api/breathing':    require('./routes/breathing'),
  '/api/quotes':       require('./routes/quotes'),
  '/api/affirmations': require('./routes/affirmations'),
  '/api/sleep':        require('./routes/sleep'),
  '/api/sos':          require('./routes/sos'),
  '/api/settings':     require('./routes/settings'),
  '/api/reports':      require('./routes/reports'),
};

Object.entries(routes).forEach(([path, router]) => app.use(path, router));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '3.0', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`🧘 Brahmacharya v3 running on port ${PORT}`));
module.exports = app;
