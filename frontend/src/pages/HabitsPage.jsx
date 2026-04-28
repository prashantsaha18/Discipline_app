import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const EMOJIS = ['💪','📚','🏃','🧘','💧','🥗','😴','✍️','🎯','🌿','🚫','⚡','🔥','🌙','☀️']
const COLORS = ['green','gold','blue','purple','orange']
const COLOR_MAP = {
  green:  { bg: 'rgba(0,232,122,0.08)',  border: 'rgba(0,232,122,0.28)',  text: '#00e87a' },
  gold:   { bg: 'rgba(255,214,110,0.08)',border: 'rgba(255,214,110,0.28)',text: '#ffd66e' },
  blue:   { bg: 'rgba(100,160,255,0.08)',border: 'rgba(100,160,255,0.28)',text: '#64a0ff' },
  purple: { bg: 'rgba(180,100,255,0.08)',border: 'rgba(180,100,255,0.28)',text: '#b464ff' },
  orange: { bg: 'rgba(255,140,60,0.08)', border: 'rgba(255,140,60,0.28)', text: '#ff8c3c' },
}

export default function HabitsPage() {
  const [habits, setHabits] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', emoji: '💪', color: 'green' })
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(null)

  const fetchHabits = () => {
    axios.get('/api/habits').then(r => setHabits(r.data)).catch(() => {})
  }

  useEffect(() => { fetchHabits() }, [])

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/habits', form)
      setForm({ name: '', emoji: '💪', color: 'green' })
      setShowAdd(false)
      fetchHabits()
    } catch (e) {}
    setSaving(false)
  }

  const handleToggle = async (id) => {
    if (toggling === id) return
    setToggling(id)
    try {
      const { data } = await axios.post(`/api/habits/${id}/toggle`)
      setHabits(prev => prev.map(h => h.id === id ? { ...h, logged_today: data.completed } : h))
    } catch (e) {}
    setToggling(null)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/habits/${id}`)
      setHabits(prev => prev.filter(h => h.id !== id))
    } catch (e) {}
  }

  const completedCount = habits.filter(h => h.logged_today).length

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 20px 40px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Daily Habits</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', color: 'var(--text-bright)', fontWeight: 300 }}>
              {completedCount}/{habits.length} done
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => setShowAdd(p => !p)}
            style={{
              padding: '10px 16px', background: 'rgba(0,232,122,0.08)',
              border: '1px solid rgba(0,232,122,0.25)', borderRadius: '12px',
              color: 'var(--glow-green)', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.06em'
            }}>
            {showAdd ? '✕ Close' : '+ Add'}
          </motion.button>
        </div>

        {/* Progress bar */}
        {habits.length > 0 && (
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${habits.length ? (completedCount / habits.length) * 100 : 0}%` }}
              style={{ height: '100%', background: 'var(--glow-green)', borderRadius: '2px', boxShadow: '0 0 6px var(--glow-green)' }}
            />
          </div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Habit name (e.g. Cold shower, No phone in morning)"
                  style={{
                    width: '100%', padding: '13px 15px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                    color: 'var(--text-bright)', fontSize: '13px', outline: 'none',
                    fontFamily: 'DM Sans, sans-serif', marginBottom: '12px'
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Icon</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setForm(p => ({ ...p, emoji: e }))}
                        style={{
                          width: '32px', height: '32px', fontSize: '16px', border: `1px solid ${form.emoji === e ? 'var(--glow-green)' : 'var(--border)'}`,
                          background: form.emoji === e ? 'rgba(0,232,122,0.08)' : 'transparent',
                          borderRadius: '8px', cursor: 'pointer'
                        }}>{e}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Color</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {COLORS.map(c => {
                      const cm = COLOR_MAP[c]
                      return (
                        <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                          style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: cm.text, border: `2px solid ${form.color === c ? 'white' : 'transparent'}`,
                            cursor: 'pointer', opacity: form.color === c ? 1 : 0.4
                          }} />
                      )
                    })}
                  </div>
                </div>
                <button onClick={handleAdd} disabled={saving || !form.name.trim()}
                  style={{
                    width: '100%', padding: '13px', background: 'rgba(0,232,122,0.1)',
                    border: '1px solid rgba(0,232,122,0.28)', borderRadius: '12px',
                    color: 'var(--glow-green)', fontSize: '12px', letterSpacing: '0.1em',
                    textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                    opacity: !form.name.trim() ? 0.4 : 1
                  }}>
                  {saving ? 'Saving...' : '+ Create Habit'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Habit list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {habits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>◌</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: 'var(--text-mid)', marginBottom: '8px' }}>No habits yet.</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Add your first habit above to begin tracking.</div>
            </div>
          ) : (
            habits.map((h, i) => {
              const cm = COLOR_MAP[h.color] || COLOR_MAP.green
              return (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '16px 14px',
                    background: h.logged_today ? cm.bg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${h.logged_today ? cm.border : 'var(--border)'}`,
                    borderRadius: '14px', transition: 'all 0.3s'
                  }}>
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{h.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: h.logged_today ? cm.text : 'var(--text-bright)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {h.logged_today ? 'Done today ✓' : 'Not done yet'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleToggle(h.id)}
                      disabled={toggling === h.id}
                      style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: h.logged_today ? cm.bg : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${h.logged_today ? cm.text : 'rgba(255,255,255,0.1)'}`,
                        cursor: 'pointer', fontSize: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: cm.text, transition: 'all 0.25s'
                      }}>
                      {h.logged_today ? '✓' : '○'}
                    </motion.button>
                    <button onClick={() => handleDelete(h.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,80,80,0.25)', fontSize: '14px', padding: '4px' }}
                      title="Archive">✕</button>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
