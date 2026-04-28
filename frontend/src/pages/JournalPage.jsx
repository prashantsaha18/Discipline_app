import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const MOODS = [
  { id: 'peaceful', emoji: '🌿' }, { id: 'focused', emoji: '🎯' },
  { id: 'anxious',  emoji: '⚡' }, { id: 'bored',   emoji: '🌑' },
  { id: 'stressed', emoji: '🔥' }, { id: 'tired',   emoji: '🌙' },
  { id: 'grateful', emoji: '🙏' }, { id: 'angry',   emoji: '💢' },
]

export default function JournalPage() {
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(null)
  const [todayEntry, setTodayEntry] = useState(null)
  const [pastEntries, setPastEntries] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [view, setView] = useState('today') // today | past

  useEffect(() => {
    axios.get('/api/journal/today').then(r => {
      if (r.data) { setTodayEntry(r.data); setContent(r.data.content); setMood(r.data.mood) }
    }).catch(() => {})
    axios.get('/api/journal').then(r => setPastEntries(r.data.entries || [])).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      const { data } = await axios.post('/api/journal', { content, mood })
      setTodayEntry(data)
      setSaved(true)
      // Award first journal achievement
      axios.post('/api/achievements/award/first_journal').catch(() => {})
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {}
    setSaving(false)
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 20px 40px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header + tabs */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Inner Voice</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', color: 'var(--text-bright)', fontWeight: 300, marginBottom: '16px' }}>
            Journal
          </div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '3px' }}>
            {['today', 'past'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
                  background: view === v ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: view === v ? 'var(--text-bright)' : 'var(--text-muted)',
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  letterSpacing: '0.05em', textTransform: 'capitalize', transition: 'all 0.2s'
                }}>
                {v === 'today' ? "Today's Entry" : 'Past Entries'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'today' && (
            <motion.div key="today" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Mood selector */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Today's mood</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {MOODS.map(m => (
                    <button key={m.id} onClick={() => setMood(p => p === m.id ? null : m.id)}
                      style={{
                        padding: '7px 10px', fontSize: '18px',
                        background: mood === m.id ? 'rgba(0,232,122,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${mood === m.id ? 'rgba(0,232,122,0.35)' : 'var(--border)'}`,
                        borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text area */}
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="What's on your mind today? Write freely — no judgment here."
                style={{
                  width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px',
                  color: 'var(--text-bright)', fontSize: '14px', lineHeight: 1.7,
                  resize: 'none', height: '200px', outline: 'none',
                  fontFamily: 'Cormorant Garamond, serif', caretColor: 'var(--glow-green)',
                  marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{wordCount} words</span>
                {saved && <span style={{ fontSize: '11px', color: 'var(--glow-green)' }}>✓ Saved</span>}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                disabled={!content.trim() || saving}
                style={{
                  width: '100%', padding: '15px',
                  background: content.trim() ? 'rgba(0,232,122,0.09)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${content.trim() ? 'rgba(0,232,122,0.28)' : 'var(--border)'}`,
                  borderRadius: '14px', color: content.trim() ? 'var(--glow-green)' : 'var(--text-muted)',
                  fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: content.trim() ? 'pointer' : 'default', fontFamily: 'DM Sans, sans-serif',
                  opacity: content.trim() ? 1 : 0.5, transition: 'all 0.3s'
                }}>
                {saving ? 'Saving...' : todayEntry ? '◎ Update Entry' : '◎ Save Entry'}
              </motion.button>
            </motion.div>
          )}

          {view === 'past' && (
            <motion.div key="past" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {pastEntries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📖</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: 'var(--text-mid)' }}>No entries yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pastEntries.map((e, i) => {
                    const moodEmo = MOODS.find(m => m.id === e.mood)?.emoji
                    return (
                      <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(e.entry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {moodEmo && <span style={{ fontSize: '16px' }}>{moodEmo}</span>}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{e.word_count}w</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: 1.6, margin: 0,
                          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {e.content}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
