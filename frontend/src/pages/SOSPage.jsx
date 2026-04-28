import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const TECHNIQUES = [
  {
    id: 'grounding', icon: '🌍', label: '5-4-3-2-1 Grounding',
    steps: ['Name 5 things you can SEE right now', 'Name 4 things you can TOUCH', 'Name 3 things you can HEAR', 'Name 2 things you can SMELL', 'Name 1 thing you can TASTE'],
    color: 'rgba(0,232,122,0.6)'
  },
  {
    id: 'cold_water', icon: '💧', label: 'Cold Water Reset',
    steps: ['Go to the sink right now', 'Run cold water over your wrists', 'Splash your face 3 times', 'Take 5 slow deep breaths', 'Notice how you feel now'],
    color: 'rgba(100,180,255,0.6)'
  },
  {
    id: 'movement', icon: '🏃', label: 'Emergency Movement',
    steps: ['Stand up immediately', 'Do 20 jumping jacks right now', 'Do 10 pushups or wall pushups', 'Walk to another room', 'Notice your breathing normalise'],
    color: 'rgba(255,140,80,0.6)'
  },
  {
    id: 'box_breath', icon: '🌬️', label: 'Box Breathing',
    steps: ['Breathe IN for 4 counts slowly', 'HOLD for 4 counts — don\'t breathe', 'Breathe OUT for 4 counts fully', 'HOLD empty for 4 counts', 'Repeat 4 more times'],
    color: 'rgba(180,100,255,0.6)'
  },
  {
    id: 'mantra', icon: '🙏', label: 'Repeat Your Mantra',
    steps: ['"This urge will pass"', '"I am in control of my mind"', '"I choose my future self"', '"I am stronger than this moment"', '"Every second I resist, I grow stronger"'],
    color: 'rgba(255,214,110,0.6)'
  },
]

export default function SOSPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('panic') // panic | technique | done
  const [selected, setSelected] = useState(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [sessionId, setSessionId] = useState(null)
  const [used, setUsed] = useState([])
  const [affirmation, setAffirmation] = useState(null)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    axios.post('/api/sos/start').then(r => setSessionId(r.data.session_id)).catch(() => {})
    axios.get('/api/affirmations/random').then(r => setAffirmation(r.data)).catch(() => {})
  }, [])

  const selectTech = (tech) => {
    setSelected(tech)
    setStepIdx(0)
    setPhase('technique')
    if (!used.includes(tech.id)) setUsed(prev => [...prev, tech.id])
  }

  const nextStep = () => {
    if (stepIdx < selected.steps.length - 1) {
      setStepIdx(s => s + 1)
    } else {
      setPhase('done')
    }
  }

  const finish = async () => {
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000)
    if (sessionId) {
      await axios.put(`/api/sos/${sessionId}/complete`, {
        duration_seconds: elapsed,
        techniques_used: used
      }).catch(() => {})
    }
    navigate('/')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#02020a',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px', zIndex: 200, overflow: 'hidden'
    }}>
      {/* Pulsing background */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(0,232,122,1)', filter: 'blur(100px)', pointerEvents: 'none' }}
      />

      <AnimatePresence mode="wait">
        {/* PANIC */}
        {phase === 'panic' && (
          <motion.div key="panic" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: '52px', marginBottom: '20px' }}>🆘</motion.div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', color: 'var(--text-bright)', marginBottom: '8px', lineHeight: 1.3 }}>
              You reached out.<br/>That takes courage.
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.6 }}>
              You are safe. This feeling is temporary.<br/>Choose a technique below.
            </div>

            {affirmation && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ margin: '16px 0', padding: '16px', background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.2)', borderRadius: '14px' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', color: 'rgba(0,232,122,0.9)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                  "{affirmation.text}"
                </p>
              </motion.div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '4px' }}>
              {TECHNIQUES.map((t, i) => (
                <motion.button key={t.id}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                  whileTap={{ scale: 0.97 }} onClick={() => selectTech(t)}
                  style={{
                    padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '13px', cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.2s'
                  }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-bright)', fontWeight: 500 }}>{t.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.steps.length} steps</div>
                  </div>
                  {used.includes(t.id) && <span style={{ fontSize: '14px', color: 'var(--glow-green)' }}>✓</span>}
                </motion.button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={finish}
                style={{ flex: 1, padding: '13px', background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.25)', borderRadius: '12px', color: 'var(--glow-green)', fontSize: '12px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
                I'm OK Now
              </button>
              <button onClick={() => navigate('/')}
                style={{ padding: '13px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Exit
              </button>
            </div>
          </motion.div>
        )}

        {/* TECHNIQUE */}
        {phase === 'technique' && selected && (
          <motion.div key="tech" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '16px' }}>{selected.icon}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {selected.label}
            </div>

            {/* Step counter */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '28px' }}>
              {selected.steps.map((_, i) => (
                <div key={i} style={{
                  width: '28px', height: '3px', borderRadius: '2px',
                  background: i <= stepIdx ? selected.color : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.4s', boxShadow: i === stepIdx ? `0 0 6px ${selected.color}` : 'none'
                }} />
              ))}
            </div>

            {/* Current step */}
            <motion.div key={stepIdx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '28px 20px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${selected.color.replace('0.6', '0.2')}`, borderRadius: '20px', marginBottom: '24px', boxShadow: `0 0 30px ${selected.color.replace('0.6', '0.04')}` }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
                Step {stepIdx + 1} of {selected.steps.length}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: 'var(--text-bright)', lineHeight: 1.5 }}>
                {selected.steps[stepIdx]}
              </div>
            </motion.div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={nextStep}
              style={{
                width: '100%', padding: '17px',
                background: selected.color.replace('0.6', '0.1'),
                border: `1px solid ${selected.color.replace('0.6', '0.3')}`,
                borderRadius: '14px', color: 'var(--text-bright)',
                fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginBottom: '12px'
              }}>
              {stepIdx < selected.steps.length - 1 ? 'Next Step →' : 'Complete ✓'}
            </motion.button>

            <button onClick={() => setPhase('panic')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
              ← All techniques
            </button>
          </motion.div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', maxWidth: '300px' }}>
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2, repeat: 3 }}
              style={{ fontSize: '60px', marginBottom: '20px' }}>🌿</motion.div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '34px', color: 'var(--glow-green)', textShadow: '0 0 30px rgba(0,232,122,0.4)', marginBottom: '12px' }}>
              You survived it.
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.6 }}>
              That moment of strength just became part of who you are.
            </div>
            {used.length > 1 && (
              <div style={{ fontSize: '12px', color: 'rgba(0,232,122,0.5)', marginBottom: '24px' }}>
                Used {used.length} techniques — that's self-mastery.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={finish}
                style={{ padding: '16px 40px', background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.28)', borderRadius: '14px', color: 'var(--glow-green)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Return Home
              </motion.button>
              <button onClick={() => setPhase('panic')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
                I need another technique
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
