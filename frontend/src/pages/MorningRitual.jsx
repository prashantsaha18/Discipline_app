import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function MorningRitual() {
  const navigate = useNavigate()
  const [steps, setSteps] = useState({ confirmed_awake: false, drank_water: false, did_breathing: false })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const toggle = (key) => setSteps(prev => ({ ...prev, [key]: !prev[key] }))
  const allDone = Object.values(steps).every(Boolean)

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.post('/api/rituals/morning', steps)
      setSaved(true)
      setTimeout(() => navigate('/'), 2000)
    } catch (e) {}
    setSaving(false)
  }

  const rituals = [
    { key: 'confirmed_awake', icon: '☀️', label: 'I am awake', desc: 'Feet on the floor. Mind alert.' },
    { key: 'drank_water', icon: '💧', label: 'Drink water', desc: 'A full glass before anything else.' },
    { key: 'did_breathing', icon: '🌬️', label: 'Breathe deep', desc: '4 breaths in. 4 hold. 6 out.' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'auto',
      background: 'linear-gradient(180deg, #0a0612 0%, #120a1a 30%, #05050a 100%)',
    }}>
      {/* Sunrise ambient */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(255,160,60,0.12) 0%, rgba(255,100,30,0.06) 40%, transparent 70%)',
        filter: 'blur(30px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)',
        width: '300px', height: '200px',
        background: 'radial-gradient(ellipse, rgba(255,214,110,0.08) 0%, transparent 70%)',
        filter: 'blur(20px)', pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '380px', margin: '0 auto', padding: '60px 24px 40px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', paddingTop: '40px' }}>
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}
                style={{ fontSize: '64px', marginBottom: '20px' }}>🌅</motion.div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: 'var(--glow-gold)', textShadow: '0 0 30px rgba(255,214,110,0.5)' }}>
                Morning claimed.
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '12px' }}>
                A strong morning builds a strong day.
              </div>
            </motion.div>
          ) : (
            <motion.div key="ritual" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(255,160,60,0.7)', textTransform: 'uppercase', marginBottom: '16px' }}>
                  Morning Ritual
                </motion.div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '34px', fontWeight: 300, color: 'var(--text-bright)', lineHeight: 1.3 }}>
                  Begin with intention.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
                {rituals.map(({ key, icon, label, desc }, i) => (
                  <motion.button key={key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => toggle(key)}
                    style={{
                      padding: '20px', background: steps[key] ? 'rgba(255,214,110,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${steps[key] ? 'rgba(255,214,110,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left',
                      transition: 'all 0.3s',
                      boxShadow: steps[key] ? '0 0 20px rgba(255,214,110,0.06)' : 'none'
                    }}>
                    <span style={{ fontSize: '28px' }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: steps[key] ? 'var(--glow-gold)' : 'var(--text-bright)', fontWeight: 500, marginBottom: '3px' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      border: `1.5px solid ${steps[key] ? 'var(--glow-gold)' : 'rgba(255,255,255,0.15)'}`,
                      background: steps[key] ? 'var(--glow-gold)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.3s'
                    }}>
                      {steps[key] && <span style={{ fontSize: '12px', color: '#000' }}>✓</span>}
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.button animate={{ opacity: allDone ? 1 : 0.4 }}
                whileTap={allDone ? { scale: 0.97 } : {}}
                onClick={allDone ? handleSave : undefined}
                style={{
                  width: '100%', padding: '18px',
                  background: allDone ? 'rgba(255,214,110,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${allDone ? 'rgba(255,214,110,0.4)' : 'var(--border)'}`,
                  borderRadius: '16px', color: allDone ? 'var(--glow-gold)' : 'var(--text-muted)',
                  fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: allDone ? 'pointer' : 'default', transition: 'all 0.3s',
                  boxShadow: allDone ? '0 0 30px rgba(255,214,110,0.08)' : 'none'
                }}>
                {saving ? 'Saving...' : allDone ? '🌅 Seal the Morning' : `${Object.values(steps).filter(Boolean).length} / 3 complete`}
              </motion.button>

              <button onClick={() => navigate('/')} style={{
                display: 'block', margin: '20px auto 0', background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', letterSpacing: '0.06em'
              }}>← Back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
