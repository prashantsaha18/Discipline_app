-- Brahmacharya: Inner Control — Full Database Schema v2

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100),
  is_anonymous BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(60) DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STREAKS
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_start_date DATE,
  last_check_in DATE,
  total_relapses INTEGER DEFAULT 0,
  freeze_tokens INTEGER DEFAULT 1,
  last_freeze_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY LOGS
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('discipline', 'relapse', 'neutral', 'frozen')) DEFAULT 'neutral',
  morning_ritual_done BOOLEAN DEFAULT FALSE,
  night_reflection_done BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- URGE EVENTS
CREATE TABLE IF NOT EXISTS urge_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  mood VARCHAR(20),
  trigger_type VARCHAR(50),
  action_taken VARCHAR(50),
  notes TEXT
);

-- MOOD & AWARENESS LOGS
CREATE TABLE IF NOT EXISTS awareness_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  mood VARCHAR(20) CHECK (mood IN ('peaceful','anxious','bored','stressed','focused','tired','angry','grateful')),
  trigger_type VARCHAR(50) CHECK (trigger_type IN ('boredom','stress','loneliness','fatigue','social_media','night','none','relationship','work')),
  context VARCHAR(100),
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 10)
);

-- HABITS
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) DEFAULT '◎',
  color VARCHAR(30) DEFAULT 'green',
  target_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABIT LOGS
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

-- JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(20),
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- MORNING RITUALS
CREATE TABLE IF NOT EXISTS morning_rituals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ritual_date DATE NOT NULL,
  confirmed_awake BOOLEAN DEFAULT FALSE,
  drank_water BOOLEAN DEFAULT FALSE,
  did_breathing BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, ritual_date)
);

-- NIGHT REFLECTIONS
CREATE TABLE IF NOT EXISTS night_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reflection_date DATE NOT NULL,
  trigger_description TEXT,
  response_description TEXT,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, reflection_date)
);

-- FUTURE SELF MESSAGES
CREATE TABLE IF NOT EXISTS future_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_key VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  streak_at_unlock INTEGER,
  UNIQUE(user_id, achievement_key)
);

-- BREATHING SESSIONS
CREATE TABLE IF NOT EXISTS breathing_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  technique VARCHAR(30) DEFAULT '4-7-8',
  cycles_completed INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_urge_events_user ON urge_events(user_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_awareness_logs_user ON awareness_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_current ON streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- TRIGGER: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER streaks_updated_at BEFORE UPDATE ON streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER journal_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===================== v3 ADDITIONS =====================

-- AFFIRMATIONS
CREATE TABLE IF NOT EXISTS affirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category VARCHAR(30) DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  show_in_urge BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLEEP LOGS
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  bedtime TIME,
  wake_time TIME,
  duration_hours NUMERIC(4,2),
  quality INTEGER CHECK (quality BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- SOS SESSIONS
CREATE TABLE IF NOT EXISTS sos_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  techniques_used TEXT[],
  completed BOOLEAN DEFAULT FALSE
);

-- USER SETTINGS
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  urge_timer_minutes INTEGER DEFAULT 10,
  theme_intensity VARCHAR(20) DEFAULT 'standard',
  show_streak_on_lock BOOLEAN DEFAULT TRUE,
  daily_reminder_hour INTEGER DEFAULT 21,
  quote_category VARCHAR(30) DEFAULT 'all',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MILESTONE LOGS (track which have been shown)
CREATE TABLE IF NOT EXISTS milestone_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  streak_day INTEGER NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_day)
);

-- HABIT STREAKS (denormalized for perf)
CREATE TABLE IF NOT EXISTS habit_streaks (
  habit_id UUID PRIMARY KEY REFERENCES habits(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_logged DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user ON sleep_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_affirmations_user ON affirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_sessions_user ON sos_sessions(user_id);
