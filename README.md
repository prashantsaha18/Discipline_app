# 🧘 Brahmacharya: Inner Control v2.0

> *A digital sanctuary for self-discipline. Dark, immersive, and intentional.*

---

## ✨ What's New in v2.0

### New Features
- 🏅 **Habits Tracker** — Create custom habits with emoji + color, toggle daily, track streaks
- 📖 **Journal** — Daily private entries with mood tagging, word count, past entries view
- 🏆 **Achievements** — 8 milestone badges from Day 1 to 90-day Brahmacharya Master
- 🌬️ **Breathing Studio** — 4 techniques (4-7-8, Box, 4-4-6, Coherent) with animated orb + session logging
- 👤 **Profile Page** — Edit display name, timezone, leaderboard anonymity
- 🧊 **Freeze Tokens** — Protect streak on a difficult day (1 token given on signup)
- 📊 **Enhanced Insights** — Urge survival rate, survival chart, avg session duration

### Bug Fixes
- ✅ **Streak idempotency** — Check-in now safe to call multiple times; returns `already_checked_in: true`
- ✅ **Timezone-aware dates** — All date logic uses user's local timezone, not server UTC
- ✅ **401 auto-logout** — Axios interceptor auto-logs out on expired JWT
- ✅ **Breathing state machine** — Rewrote with `useRef` to eliminate nested `setState` race condition
- ✅ **SQL injection** — Removed all template-literal SQL; all queries use parameterized `$1` style
- ✅ **Dashboard today detection** — Correctly detects check-in from `last_check_in` field on mount
- ✅ **Unused state** — Removed `relapseConfirm` which was declared but never used
- ✅ **NavLayout indicator** — Fixed `layoutId` pill with correct positioning and relative parent
- ✅ **Missing try/catch** — All backend routes now have proper error handling
- ✅ **Input validation** — Auth routes validate field lengths, password minimum, email trimming

---

## 🗂 Folder Structure

```
brahmacharya/
├── README.md
├── backend/
│   ├── config/
│   │   ├── db.js              # PostgreSQL pool (20 connections)
│   │   └── schema.sql         # Full DB schema v2 with all tables
│   ├── middleware/
│   │   └── auth.js            # JWT verify, distinguishes expired vs invalid
│   ├── routes/
│   │   ├── auth.js            # Register, Login, /me, PUT /profile
│   │   ├── streaks.js         # Check-in (idempotent), relapse, freeze, achievements
│   │   ├── calendar.js        # 90-day heatmap data (parameterized)
│   │   ├── urge.js            # Urge sessions: start, complete, history, stats
│   │   ├── awareness.js       # Mood + trigger logging with validation
│   │   ├── rituals.js         # Morning ritual, night reflection, today status
│   │   ├── messages.js        # Future self letters: active, all, create, delete
│   │   ├── insights.js        # Urge stats, triggers, moods, weekly pattern
│   │   ├── leaderboard.js     # Ranked board with anonymity support
│   │   ├── habits.js          # CRUD habits + daily toggle + history
│   │   ├── journal.js         # Daily journal: today, paginated history, stats
│   │   ├── achievements.js    # 8 achievements: GET list, POST award manual ones
│   │   └── breathing.js       # 4 techniques, session logging, stats
│   ├── server.js              # Express app with all 13 route groups
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── NavLayout.jsx      # Bottom nav + top bar, fixed indicator
    │   │   └── LoadingScreen.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx    # Auth state, 401 interceptor, timezone on register
    │   ├── pages/
    │   │   ├── AuthPage.jsx           # Login / Register with validation
    │   │   ├── Dashboard.jsx          # Hero streak, ritual status bar, heatmap, freeze
    │   │   ├── UrgePage.jsx           # Focus chamber, fixed breathing state machine
    │   │   ├── MorningRitual.jsx      # Sunrise ritual (3 steps)
    │   │   ├── NightReflection.jsx    # Night journal (trigger + response + rating)
    │   │   ├── HabitsPage.jsx         # Habit CRUD with emoji/color picker + toggle
    │   │   ├── JournalPage.jsx        # Daily entries, mood tags, past entries
    │   │   ├── InsightsPage.jsx       # Charts: hourly urges, triggers, moods, survival
    │   │   ├── LeaderboardPage.jsx    # Gold/silver/bronze podium + your rank
    │   │   ├── FutureMessage.jsx      # Letter to future self
    │   │   ├── AchievementsPage.jsx   # All 8 badges: unlocked + locked view
    │   │   ├── BreathingPage.jsx      # 4 techniques with animated orb + session save
    │   │   └── ProfilePage.jsx        # Display name, timezone, anonymous toggle
    │   ├── App.jsx                # All routes mapped
    │   ├── main.jsx
    │   └── index.css              # CSS variables, animations, glass utilities
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
```

**.env:**
```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/brahmacharya
JWT_SECRET=minimum_32_character_random_secret_here
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Database

```bash
psql -U postgres -c "CREATE DATABASE brahmacharya;"
psql -U postgres -d brahmacharya -f config/schema.sql
```

### 3. Start Backend

```bash
npm run dev    # development (nodemon)
npm start      # production
```

### 4. Frontend

```bash
cd ../frontend
npm install
npm run dev    # → http://localhost:3000
```

---

## 🔌 API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create account (sends timezone) |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user profile |
| PUT | `/api/auth/profile` | ✅ | Update display name, timezone, anonymity |
| GET | `/api/streaks` | ✅ | Get streak data |
| POST | `/api/streaks/checkin` | ✅ | Daily check-in (idempotent) |
| POST | `/api/streaks/relapse` | ✅ | Reset streak |
| POST | `/api/streaks/freeze` | ✅ | Use freeze token |
| GET | `/api/calendar` | ✅ | 90-day heatmap |
| POST | `/api/urge/start` | ✅ | Begin urge session |
| PUT | `/api/urge/:id/complete` | ✅ | Complete urge session |
| GET | `/api/urge/stats` | ✅ | Survival rate stats |
| POST | `/api/awareness` | ✅ | Log mood + trigger |
| GET | `/api/rituals/today` | ✅ | Today's ritual status |
| POST | `/api/rituals/morning` | ✅ | Morning ritual |
| POST | `/api/rituals/night` | ✅ | Night reflection |
| GET | `/api/messages/active` | ✅ | Active future letter |
| POST | `/api/messages` | ✅ | Save future letter |
| GET | `/api/insights` | ✅ | All smart insights |
| GET | `/api/leaderboard` | ✅ | Ranked board |
| GET | `/api/habits` | ✅ | All habits with today's status |
| POST | `/api/habits` | ✅ | Create habit |
| PUT | `/api/habits/:id` | ✅ | Update habit |
| DELETE | `/api/habits/:id` | ✅ | Archive habit |
| POST | `/api/habits/:id/toggle` | ✅ | Toggle today's log |
| GET | `/api/journal/today` | ✅ | Today's journal entry |
| GET | `/api/journal` | ✅ | Paginated journal history |
| POST | `/api/journal` | ✅ | Save/update today's entry |
| GET | `/api/achievements` | ✅ | All 8 achievements |
| POST | `/api/achievements/award/:key` | ✅ | Award manual achievement |
| GET | `/api/breathing/techniques` | ✅ | List all techniques |
| POST | `/api/breathing/session` | ✅ | Log breathing session |
| GET | `/api/breathing/stats` | ✅ | Breathing stats |

---

## 🏆 Achievements

| Key | Emoji | Title | Trigger |
|-----|-------|-------|---------|
| first_day | 🌱 | First Step | 1-day streak |
| week_warrior | 🔥 | Week Warrior | 7-day streak |
| two_weeks | ⚡ | Fortnight Strong | 14-day streak |
| one_month | 🌙 | Month of Mastery | 30-day streak |
| sixty_days | 💎 | Diamond Mind | 60-day streak |
| ninety_days | 🏆 | Brahmacharya Master | 90-day streak |
| first_journal | 📖 | Inner Voice | First journal entry |
| urge_slayer | 🛡️ | Urge Slayer | 5 completed urge sessions |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| `--bg-void` | `#05050a` |
| `--glow-green` | `#00e87a` |
| `--glow-gold` | `#ffd66e` |
| `--text-bright` | `#f0f0fa` |
| `--text-muted` | `#5a5a7a` |
| Display font | Cormorant Garamond |
| Body font | DM Sans |

---

*"Conquer the mind, conquer the world."*
