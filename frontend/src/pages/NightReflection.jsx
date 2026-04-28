import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function NightReflection() {
  const navigate = useNavigate()
  const [trigger, setTrigger] = useState('')
  const [response, setResponse] = useState('')
  const [rating, setRating] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!trigger || !response) return
    setSaving(true)
    try {
      await axios.post('/api/rituals/night', {
        trigger_description: trigger,
        response_description: response,
        overall_rating: rating,
      })
      setSaved(true)
      setTimeout(() => navigate('/'), 2500)
    } catch (e) {}
    setSaving(false)
  }

  const stars = [1, 2, 3, 4, 5]

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'auto',
      background: 'linear-gradient(180deg, #05050a 0%, #080510 40%, #050308 100%)',
    }}>
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '400px', height: '250px',
        background: 'radial-gradient(ellipse, rgba(80,60,180,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '380px', margin: '0 auto', padding: '60px 24px 40px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', paddingTop: '60px' }}>
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize: '60px', marginBottom: '24px' }}>🌙</motion.div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: '#9090d0' }}>
                Rest well, warrior.
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Tomorrow, you begin again.
              </div>
            </motion.div>
          ) : (
            <motion.div key="reflect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(144,144,208,0.6)', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Night Reflection
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', fontWeight: 300, color: 'var(--text-bright)' }}>
                  Witness the day.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '11px', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                    What triggered you today?
                  </label>
                  <textarea value={trigger} onChange={e => setTrigger(e.target.value)}
                    placeholder="Boredom, loneliness, stress..."
                    style={{
                      width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)', borderRadius: '12px',
                      color: 'var(--text-bright)', fontSize: '14px', lineHeight: 1.6,
                      resize: 'none', height: '90px', outline: 'none',
                      fontFamily: 'DM Sans, sans-serif',
                      caretColor: '#9090d0'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                    How did you respond?
                  </label>
                  <textarea value={response} onChange={e => setResponse(e.target.value)}
                    placeholder="I went for a walk, called a friend..."
                    style={{
                      width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)', borderRadius: '12px',
                      color: 'var(--text-bright)', fontSize: '14px', lineHeight: 1.6,
                      resize: 'none', height: '90px', outline: 'none',
                      fontFamily: 'DM Sans, sans-serif',
                      caretColor: '#9090d0'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                    Overall day
                  </label>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {stars.map(s => (
                      <motion.button key={s} whileTap={{ scale: 0.9 }}
                        onClick={() => setRating(s)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '28px', opacity: rating >= s ? 1 : 0.2,
                          transition: 'opacity 0.2s', filter: rating >= s ? 'drop-shadow(0 0 6px rgba(255,214,110,0.6))' : 'none'
                        }}>⭐</motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  animate={{ opacity: (trigger && response) ? 1 : 0.4 }}
                  whileTap={(trigger && response) ? { scale: 0.97 } : {}}
                  onClick={(trigger && response) ? handleSave : undefined}
                  style={{
                    width: '100%', padding: '18px', marginTop: '8px',
                    background: 'rgba(144,144,208,0.08)',
                    border: `1px solid ${(trigger && response) ? 'rgba(144,144,208,0.35)' : 'var(--border)'}`,
                    borderRadius: '16px', color: '#9090d0',
                    fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: (trigger && response) ? 'pointer' : 'default', transition: 'all 0.3s'
                  }}>
                  {saving ? 'Saving...' : '🌙 Close the Day'}
                </motion.button>

                <button onClick={() => navigate('/')} style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '12px', cursor: 'pointer', letterSpacing: '0.06em', textAlign: 'center'
                }}>← Back</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
