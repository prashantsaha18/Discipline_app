import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const TECHNIQUES = [
  { id: '4-7-8',    label: '4-7-8 Relaxing',   phases: [{ name:'inhale',duration:4},{ name:'hold',duration:7},{ name:'exhale',duration:8}],   desc: 'Reduces anxiety, induces sleep' },
  { id: 'box',      label: 'Box Breathing',     phases: [{ name:'inhale',duration:4},{ name:'hold',duration:4},{ name:'exhale',duration:4},{ name:'hold out',duration:4}], desc: 'Used by Navy SEALs for calm focus' },
  { id: '4-4-6',    label: '4-4-6 Calm',        phases: [{ name:'inhale',duration:4},{ name:'hold',duration:4},{ name:'exhale',duration:6}],     desc: 'Activates parasympathetic system' },
  { id: 'coherent', label: 'Coherent (5-5)',     phases: [{ name:'inhale',duration:5},{ name:'exhale',duration:5}],                               desc: 'Heart rate variability training' },
]

export default function BreathingPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [active, setActive] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [count, setCount] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const phaseIdxRef = useRef(0)
  const countRef = useRef(0)
  const timerRef = useRef(null)
  const totalRef = useRef(0)

  const stop = useCallback(async () => {
    clearInterval(timerRef.current)
    setActive(false)
    if (selected && cycles > 0) {
      await axios.post('/api/breathing/session', {
        technique: selected.id,
        cycles_completed: cycles,
        duration_seconds: totalRef.current,
      }).catch(() => {})
    }
    setPhaseIdx(0)
    setCount(0)
    setCycles(0)
    setTotalSeconds(0)
    totalRef.current = 0
    phaseIdxRef.current = 0
  }, [selected, cycles])

  const start = useCallback((tech) => {
    setSelected(tech)
    setActive(true)
    setPhaseIdx(0)
    phaseIdxRef.current = 0
    const startCount = tech.phases[0].duration
    countRef.current = startCount
    setCount(startCount)
    setCycles(0)
    totalRef.current = 0
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      totalRef.current += 1
      setTotalSeconds(t => t + 1)
      countRef.current -= 1
      if (countRef.current <= 0) {
        const nextIdx = (phaseIdxRef.current + 1) % tech.phases.length
        const isNewCycle = nextIdx === 0
        phaseIdxRef.current = nextIdx
        countRef.current = tech.phases[nextIdx].duration
        setPhaseIdx(nextIdx)
        setCount(tech.phases[nextIdx].duration)
        if (isNewCycle) setCycles(c => c + 1)
      } else {
        setCount(countRef.current)
      }
    }, 1000)
  }, [])

  useEffect(() => () => clearInterval(timerRef.current), [])

  const currentPhase = selected ? selected.phases[phaseIdx] : null
  const scale = currentPhase?.name === 'inhale' ? 1.3 : currentPhase?.name?.includes('hold') ? (phaseIdx % 2 === 1 ? 1.3 : 0.8) : 0.8
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const secs = String(totalSeconds % 60).padStart(2, '0')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#030308',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(100,100,255,0.04)', filter: 'blur(80px)', top: '-100px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />

      <AnimatePresence mode="wait">
        {!active ? (
          <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ width: '100%', maxWidth: '340px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.25em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Breathe</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: 'var(--text-bright)', fontWeight: 300 }}>
                Choose a technique
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {TECHNIQUES.map((t, i) => (
                <motion.button key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  whileTap={{ scale: 0.97 }} onClick={() => start(t)}
                  style={{
                    padding: '16px 18px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)', borderRadius: '14px',
                    cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '14px', alignItems: 'center'
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-bright)', fontWeight: 500, marginBottom: '3px' }}>{t.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.desc}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(100,160,255,0.5)', marginTop: '4px' }}>
                      {t.phases.map(p => `${p.name} ${p.duration}s`).join(' · ')}
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', opacity: 0.5 }}>→</div>
                </motion.button>
              ))}
            </div>
            <button onClick={() => navigate('/')} style={{ display: 'block', margin: '0 auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>← Back</button>
          </motion.div>
        ) : (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', width: '100%', maxWidth: '320px' }}>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: 'rgba(100,160,255,0.6)', letterSpacing: '0.12em' }}>
              {selected?.label}
            </div>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
              <div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: 'var(--text-mid)', fontWeight: 300 }}>{mins}:{secs}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Duration</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: 'var(--text-mid)', fontWeight: 300 }}>{cycles}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cycles</div>
              </div>
            </div>

            {/* Breathing orb */}
            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 36px' }}>
              {[1,2].map(i => (
                <motion.div key={i}
                  animate={{ scale: [1, 1.5 + i*0.2, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 5, repeat: Infinity, delay: i * 1 }}
                  style={{ position: 'absolute', inset: `-${i*20}px`, borderRadius: '50%', border: '1px solid rgba(100,160,255,0.1)' }}
                />
              ))}
              <motion.div
                animate={{ scale }}
                transition={{ duration: currentPhase?.duration || 4, ease: currentPhase?.name?.includes('hold') ? 'linear' : 'easeInOut' }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(100,160,255,0.18) 0%, rgba(100,160,255,0.04) 60%, transparent 100%)',
                  border: '1px solid rgba(100,160,255,0.3)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 50px rgba(100,160,255,0.07)'
                }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', fontWeight: 300, color: 'rgba(100,160,255,0.9)', lineHeight: 1 }}>
                  {count}
                </div>
                <div style={{ fontSize: '9px', letterSpacing: '0.22em', color: 'rgba(100,160,255,0.5)', textTransform: 'uppercase', marginTop: '6px' }}>
                  {currentPhase?.name || ''}
                </div>
              </motion.div>
            </div>

            {/* Phase indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
              {selected?.phases.map((p, i) => (
                <div key={i} style={{
                  height: '3px', borderRadius: '2px',
                  width: `${Math.max(24, p.duration * 6)}px`,
                  background: i === phaseIdx ? 'rgba(100,160,255,0.8)' : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.4s', boxShadow: i === phaseIdx ? '0 0 6px rgba(100,160,255,0.5)' : 'none'
                }} />
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={stop}
              style={{
                padding: '14px 36px', background: 'rgba(100,160,255,0.08)',
                border: '1px solid rgba(100,160,255,0.22)', borderRadius: '14px',
                color: 'rgba(100,160,255,0.8)', fontSize: '12px', letterSpacing: '0.12em',
                textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
              }}>
              End Session
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
