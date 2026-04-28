import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const ACTIONS = [
  { id: 'move_body', icon: '🚶', label: 'Move Your Body', desc: 'Walk, stretch, do 10 pushups' },
  { id: 'hydrate',   icon: '💧', label: 'Hydrate',        desc: 'Drink a full glass of water now' },
  { id: 'breathe',   icon: '🌬️', label: 'Breathe Deep',  desc: 'Inhale 4s · Hold 4s · Exhale 6s' },
]

const TOTAL = 600

// Fixed: isolated breathing state machine — no nested setState
function useBreathing() {
  const PHASES = [
    { name: 'inhale', duration: 4 },
    { name: 'hold',   duration: 4 },
    { name: 'exhale', duration: 6 },
  ]
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [count, setCount] = useState(PHASES[0].duration)
  const phaseIdxRef = useRef(0)
  const countRef = useRef(PHASES[0].duration)

  useEffect(() => {
    const timer = setInterval(() => {
      countRef.current -= 1
      if (countRef.current <= 0) {
        const nextIdx = (phaseIdxRef.current + 1) % PHASES.length
        phaseIdxRef.current = nextIdx
        countRef.current = PHASES[nextIdx].duration
        setPhaseIdx(nextIdx)
        setCount(PHASES[nextIdx].duration)
      } else {
        setCount(countRef.current)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return { phase: PHASES[phaseIdx].name, count }
}

function BreathingCircle() {
  const { phase, count } = useBreathing()
  const scale = phase === 'inhale' ? 1.28 : phase === 'hold' ? 1.28 : 0.82
  const duration = phase === 'inhale' ? 4 : phase === 'hold' ? 0.1 : 6

  return (
    <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
      {[1, 2].map(i => (
        <motion.div key={i}
          animate={{ scale: [1, 1.5 + i * 0.25, 1], opacity: [0.25, 0, 0.25] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: i * 0.9 }}
          style={{ position: 'absolute', inset: `-${i * 18}px`, borderRadius: '50%', border: '1px solid rgba(0,232,122,0.12)' }}
        />
      ))}
      <motion.div
        animate={{ scale }}
        transition={{ duration, ease: phase === 'hold' ? 'linear' : 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,232,122,0.18) 0%, rgba(0,232,122,0.04) 60%, transparent 100%)',
          border: '1px solid rgba(0,232,122,0.38)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 50px rgba(0,232,122,0.08)'
        }}
      >
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', fontWeight: 300, color: 'var(--glow-green)', lineHeight: 1 }}>
          {count}
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '0.22em', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '5px' }}>
          {phase}
        </div>
      </motion.div>
    </div>
  )
}

export default function UrgePage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('intro') // intro | breathe | done
  const [timeLeft, setTimeLeft] = useState(TOTAL)
  const [urgeId, setUrgeId] = useState(null)
  const [futureMsg, setFutureMsg] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)
  const timerRef = useRef(null)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    axios.post('/api/urge/start', {}).then(r => setUrgeId(r.data.urge_id)).catch(() => {})
    axios.get('/api/messages/active').then(r => setFutureMsg(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (phase !== 'breathe') return
    startedAt.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const handleComplete = useCallback(async (actionId) => {
    clearInterval(timerRef.current)
    setSelectedAction(actionId)
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000)
    if (urgeId) {
      await axios.put(`/api/urge/${urgeId}/complete`, {
        duration_seconds: elapsed,
        action_taken: actionId,
      }).catch(() => {})
      // Try to award urge_slayer achievement
      axios.post('/api/achievements/award/urge_slayer').catch(() => {})
    }
    setPhase('done')
  }, [urgeId])

  const handleExit = useCallback(() => {
    clearInterval(timerRef.current)
    navigate('/')
  }, [navigate])

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const progress = (TOTAL - timeLeft) / TOTAL

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#020207',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px', zIndex: 100, overflow: 'hidden'
    }}>
      {/* Ambient */}
      <div style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(0,232,122,0.04)', filter: 'blur(80px)', top: '-120px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(100,80,255,0.03)', filter: 'blur(60px)', bottom: '10%', right: '-30px', pointerEvents: 'none' }} />

      <AnimatePresence mode="wait">
        {/* INTRO */}
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ textAlign: 'center', maxWidth: '320px', width: '100%' }}>
            <motion.div animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 3.5, repeat: Infinity }}
              style={{ fontSize: '10px', letterSpacing: '0.3em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '28px' }}>
              Focus Chamber
            </motion.div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '34px', fontWeight: 300, color: 'var(--text-bright)', lineHeight: 1.3, marginBottom: '10px' }}>
              You are stronger<br />than this moment.
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              10 minutes. Breathe. Let it pass.
            </div>

            {futureMsg && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                style={{ marginBottom: '28px', padding: '20px', background: 'rgba(255,214,110,0.05)', border: '1px solid rgba(255,214,110,0.18)', borderRadius: '16px', boxShadow: '0 0 30px rgba(255,214,110,0.03)' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,214,110,0.4)', textTransform: 'uppercase', marginBottom: '10px' }}>From your future self</div>
                <p style={{ fontSize: '14px', color: 'rgba(255,214,110,0.85)', fontStyle: 'italic', lineHeight: 1.65, fontFamily: 'Cormorant Garamond, serif' }}>
                  "{futureMsg.message}"
                </p>
              </motion.div>
            )}

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPhase('breathe')}
              style={{
                width: '100%', padding: '18px', marginBottom: '14px',
                background: 'rgba(0,232,122,0.09)', border: '1px solid rgba(0,232,122,0.28)',
                borderRadius: '15px', color: 'var(--glow-green)',
                fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
              }}>
              Begin 10 Minutes
            </motion.button>
            <button onClick={handleExit} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>← Return</button>
          </motion.div>
        )}

        {/* BREATHE */}
        {phase === 'breathe' && (
          <motion.div key="breathe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', width: '100%', maxWidth: '340px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '52px', fontWeight: 300, color: 'var(--text-mid)', letterSpacing: '0.04em', lineHeight: 1 }}>
                {mins}:{secs}
              </div>
              <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', marginTop: '10px', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', background: 'var(--glow-green)', width: `${progress * 100}%`, boxShadow: '0 0 8px var(--glow-green)' }} />
              </div>
            </div>

            <BreathingCircle />

            <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Take an action</div>
              {ACTIONS.map(a => (
                <motion.button key={a.id} whileTap={{ scale: 0.97 }} onClick={() => handleComplete(a.id)}
                  style={{
                    padding: '13px 18px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', gap: '14px',
                    cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s'
                  }}>
                  <span style={{ fontSize: '20px' }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-bright)', fontWeight: 500 }}>{a.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>
            <button onClick={handleExit} style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>← Exit Chamber</button>
          </motion.div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', maxWidth: '300px' }}>
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2, repeat: 3 }}
              style={{ fontSize: '60px', marginBottom: '22px' }}>🌿</motion.div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', color: 'var(--glow-green)', textShadow: '0 0 30px rgba(0,232,122,0.4)', marginBottom: '12px' }}>
              You held the line.
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              The urge passed. It always does.
            </div>
            {selectedAction && (
              <div style={{ marginBottom: '28px', fontSize: '12px', color: 'rgba(0,232,122,0.5)' }}>
                Action taken: {ACTIONS.find(a => a.id === selectedAction)?.label}
              </div>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleExit}
              style={{
                padding: '16px 40px', background: 'rgba(0,232,122,0.1)',
                border: '1px solid rgba(0,232,122,0.28)', borderRadius: '14px',
                color: 'var(--glow-green)', fontSize: '13px', letterSpacing: '0.12em',
                textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
              }}>
              Return Home
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
