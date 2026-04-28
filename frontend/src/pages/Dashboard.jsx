import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const MOODS = [
  { id: 'peaceful', emoji: '🌿', label: 'Peaceful' },
  { id: 'focused',  emoji: '🎯', label: 'Focused' },
  { id: 'anxious',  emoji: '⚡', label: 'Anxious' },
  { id: 'bored',    emoji: '🌑', label: 'Bored' },
  { id: 'stressed', emoji: '🔥', label: 'Stressed' },
  { id: 'tired',    emoji: '🌙', label: 'Tired' },
  { id: 'angry',    emoji: '💢', label: 'Angry' },
  { id: 'grateful', emoji: '🙏', label: 'Grateful' },
]

function FlameIcon({ streak }) {
  const clamped = Math.max(0, streak)
  const intensity = Math.min(clamped / 30, 1)
  const size = 80 + intensity * 50
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,232,122,0.25) 0%, transparent 70%)',
        }}
      />
      {[1, 2, 3].map(i => (
        <motion.div key={i}
          animate={{ scale: [1, 1.5 + i * 0.15, 1], opacity: [0.25, 0, 0.25] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute', inset: `-${i * 14}px`, borderRadius: '50%',
            border: `1px solid rgba(0,232,122,${Math.max(0.04, 0.12 / i)})`,
          }}
        />
      ))}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.52,
        filter: clamped === 0
          ? 'grayscale(1) opacity(0.4)'
          : `drop-shadow(0 0 ${Math.min(20 + clamped * 1.5, 50)}px rgba(0,232,122,0.9))`
      }}>
        🔥
      </div>
    </div>
  )
}

function HeatmapCalendar({ logs }) {
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-CA')
  const days = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toLocaleDateString('en-CA')
    const log = logs.find(l => l.log_date && l.log_date.slice(0, 10) === key)
    days.push({ date: d, key, status: log?.status || 'neutral' })
  }
  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const getStyle = (status, isToday) => {
    const base = {
      discipline: { background: 'rgba(0,232,122,0.72)', boxShadow: '0 0 5px rgba(0,232,122,0.4)' },
      relapse:    { background: 'rgba(255,70,70,0.65)',  boxShadow: '0 0 5px rgba(255,70,70,0.35)' },
      frozen:     { background: 'rgba(100,180,255,0.55)',boxShadow: '0 0 5px rgba(100,180,255,0.3)' },
      neutral:    { background: 'rgba(255,255,255,0.05)', boxShadow: 'none' },
    }
    return { ...base[status] || base.neutral, outline: isToday ? '1.5px solid var(--glow-gold)' : 'none' }
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
      <div style={{ display: 'flex', gap: '3px', minWidth: 'max-content' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {week.map((day, di) => (
              <motion.div key={di} whileHover={{ scale: 1.5, zIndex: 1 }}
                title={`${day.key} · ${day.status}`}
                style={{ width: '10px', height: '10px', borderRadius: '2px', cursor: 'default', ...getStyle(day.status, day.key === todayStr) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, total_relapses: 0, freeze_tokens: 1 })
  const [logs, setLogs] = useState([])
  const [selectedMood, setSelectedMood] = useState(null)
  const [showMoodPanel, setShowMoodPanel] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [showRelapse, setShowRelapse] = useState(false)
  const [ritualStatus, setRitualStatus] = useState({ morning: null, night: null })
  const [error, setError] = useState('')
  const [moodSaved, setMoodSaved] = useState(false)
  const [dailyQuote, setDailyQuote] = useState(null)

  const fetchAll = useCallback(() => {
    axios.get('/api/streaks').then(r => {
      const d = r.data
      setStreak(d)
      // Detect if already checked in today using last_check_in
      const todayStr = new Date().toLocaleDateString('en-CA')
      if (d.last_check_in && d.last_check_in.slice(0, 10) === todayStr) {
        setCheckedIn(true)
      }
    }).catch(() => {})
    axios.get('/api/calendar').then(r => setLogs(r.data)).catch(() => {})
    axios.get('/api/rituals/today').then(r => setRitualStatus(r.data)).catch(() => {})
    axios.get('/api/quotes/daily').then(r => setDailyQuote(r.data)).catch(() => {})
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCheckin = async () => {
    if (checkingIn || checkedIn) return
    setCheckingIn(true)
    setError('')
    try {
      const { data } = await axios.post('/api/streaks/checkin')
      setStreak(prev => ({
        ...prev,
        current_streak: data.current_streak,
        longest_streak: data.longest_streak
      }))
      setCheckedIn(true)
      axios.get('/api/calendar').then(r => setLogs(r.data))
    } catch (e) {
      setError(e.response?.data?.error || 'Check-in failed')
    } finally {
      setCheckingIn(false)
    }
  }

  const handleRelapse = async () => {
    try {
      const { data } = await axios.post('/api/streaks/relapse')
      setStreak(prev => ({ ...prev, current_streak: 0, total_relapses: data.total_relapses || prev.total_relapses + 1 }))
      setShowRelapse(false)
      setCheckedIn(false)
      axios.get('/api/calendar').then(r => setLogs(r.data))
    } catch (e) {
      setError(e.response?.data?.error || 'Reset failed')
    }
  }

  const handleFreeze = async () => {
    try {
      const { data } = await axios.post('/api/streaks/freeze')
      setStreak(prev => ({ ...prev, freeze_tokens: data.freeze_tokens }))
      setCheckedIn(true)
      axios.get('/api/calendar').then(r => setLogs(r.data))
    } catch (e) {
      setError(e.response?.data?.error || 'Freeze failed')
    }
  }

  const handleMoodLog = async (mood) => {
    if (selectedMood) return
    setSelectedMood(mood)
    try {
      await axios.post('/api/awareness', { mood, context: 'dashboard' })
      setMoodSaved(true)
      setTimeout(() => { setShowMoodPanel(false); setSelectedMood(null); setMoodSaved(false) }, 1200)
    } catch {
      setSelectedMood(null)
    }
  }

  const daysLabel = streak.current_streak === 1 ? 'day' : 'days'

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: '20px' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', padding: '36px 20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', width: '320px', height: '320px', borderRadius: '50%',
          background: 'var(--glow-green)', top: '-120px', left: '50%',
          transform: 'translateX(-50%)', opacity: 0.06, filter: 'blur(60px)', pointerEvents: 'none'
        }} />

        <FlameIcon streak={streak.current_streak} />

        <div style={{ textAlign: 'center' }}>
          <motion.div
            key={streak.current_streak}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '84px',
              fontWeight: 300, lineHeight: 1, color: 'var(--glow-green)',
              textShadow: '0 0 40px rgba(0,232,122,0.45)',
            }}
          >
            {streak.current_streak}
          </motion.div>
          <div style={{ fontSize: '11px', letterSpacing: '0.22em', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
            {daysLabel} of inner control
          </div>
        </div>

        <motion.p
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 4.5, repeat: Infinity }}
          style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '19px', color: 'var(--text-mid)', fontStyle: 'italic' }}
        >
          Stay in control
        </motion.p>

        <div style={{ display: 'flex', gap: '20px', padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          {[
            { val: streak.longest_streak || 0, color: 'var(--glow-gold)', lbl: 'Best' },
            { val: streak.current_streak || 0, color: 'var(--text-mid)', lbl: 'Now' },
            { val: streak.total_relapses || 0, color: 'rgba(255,120,120,0.7)', lbl: 'Falls' },
          ].map(({ val, color, lbl }, i, arr) => (
            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', fontWeight: 300, color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px' }}>{lbl}</div>
              </div>
              {i < arr.length - 1 && <div style={{ width: '1px', height: '30px', background: 'var(--border)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Ritual status bar */}
      <div style={{ padding: '0 20px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'morning', icon: '🌅', label: 'Morning', done: !!ritualStatus.morning?.completed_at, path: '/morning' },
            { key: 'night',   icon: '🌙', label: 'Night',   done: !!ritualStatus.night?.completed_at,   path: '/night' },
            { key: 'breathe', icon: '🌬️', label: 'Breathe', done: false, path: '/breathing' },
          ].map(r => (
            <motion.button key={r.key} whileTap={{ scale: 0.96 }} onClick={() => navigate(r.path)}
              style={{
                flex: 1, padding: '12px 6px',
                background: r.done ? 'rgba(0,232,122,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${r.done ? 'rgba(0,232,122,0.3)' : 'var(--border)'}`,
                borderRadius: '12px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
              }}>
              <span style={{ fontSize: '18px' }}>{r.done ? '✓' : r.icon}</span>
              <span style={{ fontSize: '9px', color: r.done ? 'var(--glow-green)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', fontSize: '12px', color: 'rgba(255,130,130,0.9)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleCheckin}
          disabled={checkedIn || checkingIn}
          style={{
            width: '100%', padding: '17px',
            background: checkedIn ? 'rgba(0,232,122,0.07)' : 'rgba(0,232,122,0.11)',
            border: `1px solid ${checkedIn ? 'rgba(0,232,122,0.5)' : 'rgba(0,232,122,0.28)'}`,
            borderRadius: '14px', cursor: checkedIn ? 'default' : 'pointer',
            color: 'var(--glow-green)', fontSize: '13px', letterSpacing: '0.12em',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500, textTransform: 'uppercase',
            boxShadow: checkedIn ? '0 0 20px rgba(0,232,122,0.08)' : 'none',
            transition: 'all 0.3s'
          }}>
          {checkedIn ? '✓ Checked In Today' : checkingIn ? '...' : '◉ Daily Check-In'}
        </motion.button>

        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/urge')}
          style={{
            width: '100%', padding: '17px',
            background: 'rgba(255,140,80,0.07)', border: '1px solid rgba(255,140,80,0.22)',
            borderRadius: '14px', cursor: 'pointer', color: '#ff8c50',
            fontSize: '13px', letterSpacing: '0.12em',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500, textTransform: 'uppercase',
          }}>
          ⚡ I Feel Urge
        </motion.button>

        {/* Freeze token */}
        {streak.freeze_tokens > 0 && !checkedIn && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleFreeze}
            style={{
              width: '100%', padding: '13px',
              background: 'rgba(100,180,255,0.05)', border: '1px solid rgba(100,180,255,0.18)',
              borderRadius: '14px', cursor: 'pointer', color: 'rgba(100,180,255,0.8)',
              fontSize: '12px', letterSpacing: '0.1em',
              fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase',
            }}>
            🧊 Use Freeze Token ({streak.freeze_tokens} left)
          </motion.button>
        )}

        {/* Mood check */}
        <div>
          <button onClick={() => setShowMoodPanel(p => !p)}
            style={{
              width: '100%', padding: '13px',
              background: 'transparent', border: '1px dashed rgba(255,255,255,0.07)',
              borderRadius: '13px', cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: 'DM Sans, sans-serif'
            }}>
            {showMoodPanel ? '↑ Close' : moodSaved ? '✓ Mood logged' : '◌ How are you feeling?'}
          </button>
          <AnimatePresence>
            {showMoodPanel && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '7px', paddingTop: '9px' }}>
                  {MOODS.map(m => (
                    <motion.button key={m.id} whileTap={{ scale: 0.9 }}
                      onClick={() => handleMoodLog(m.id)}
                      style={{
                        padding: '10px 4px',
                        background: selectedMood === m.id ? 'rgba(0,232,122,0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${selectedMood === m.id ? 'var(--glow-green)' : 'var(--border)'}`,
                        borderRadius: '10px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        transition: 'all 0.2s'
                      }}>
                      <span style={{ fontSize: '20px' }}>{m.emoji}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{m.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 90-day heatmap */}
        <div style={{ marginTop: '4px', padding: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
            90-Day Map
          </div>
          <HeatmapCalendar logs={logs} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {[
              ['rgba(0,232,122,0.72)', 'Discipline'],
              ['rgba(255,70,70,0.65)', 'Reset'],
              ['rgba(100,180,255,0.55)', 'Frozen'],
              ['rgba(255,255,255,0.05)', 'Neutral'],
            ].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: c }} />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>


        {/* Daily Quote */}
        {dailyQuote && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
            onClick={() => navigate('/quotes')}
            style={{ padding:'16px 18px', background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.07)', borderRadius:'14px', cursor:'pointer', transition:'all .2s' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,214,110,0.4)', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:'8px' }}>
              💬 Today's Wisdom
            </div>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'14px', color:'var(--text-mid)', fontStyle:'italic', lineHeight:1.6, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              "{dailyQuote.text}"
            </p>
            <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'6px' }}>— {dailyQuote.author}</div>
          </motion.div>
        )}

                {/* Relapse */}
        <div style={{ paddingBottom: '8px' }}>
          {!showRelapse ? (
            <button onClick={() => setShowRelapse(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,80,80,0.25)', fontSize: '11px', letterSpacing: '0.1em',
              width: '100%', padding: '8px', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif'
            }}>I need to reset</button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '16px', background: 'rgba(255,80,80,0.04)', border: '1px solid rgba(255,80,80,0.18)', borderRadius: '13px' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,180,180,0.75)', marginBottom: '14px', textAlign: 'center', fontStyle: 'italic', fontFamily: 'Cormorant Garamond, serif' }}>
                This is not failure. It is a new beginning.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowRelapse(false)}
                  style={{ flex: 1, padding: '11px', background: 'none', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                  Cancel
                </button>
                <button onClick={handleRelapse}
                  style={{ flex: 1, padding: '11px', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.28)', borderRadius: '10px', color: 'rgba(255,110,110,0.9)', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                  Reset & Rise
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
