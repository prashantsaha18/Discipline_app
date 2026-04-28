import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const MILESTONE_DATA = {
  1:   { label:'Day 1 Complete!',      emoji:'🌱', message:'You began. The hardest step is always the first.' },
  3:   { label:'3 Days Strong!',       emoji:'🌿', message:'Three days. Your resolve is real.' },
  7:   { label:'One Week!',            emoji:'🔥', message:'A full week of discipline. You are building something powerful.' },
  14:  { label:'Two Weeks!',           emoji:'⚡', message:'14 days. Neural pathways are rewiring right now.' },
  21:  { label:'21 Days!',             emoji:'🌙', message:'21 days — the habit is forming. Feel the difference.' },
  30:  { label:'One Month!',           emoji:'💫', message:'A full month. Your future self thanks you.' },
  45:  { label:'45 Days!',             emoji:'🛡️', message:'The urges are weaker. You are the warrior.' },
  60:  { label:'60 Days — Diamond!',   emoji:'💎', message:'Two months of mastery. You are exceptional.' },
  75:  { label:'75 Days!',             emoji:'🦅', message:'You see the world through clearer eyes now.' },
  90:  { label:'90 Days!',             emoji:'🏆', message:'Brahmacharya achieved. A new identity is born.' },
  120: { label:'4 Months!',            emoji:'🌟', message:'You are in the top 1%. Extraordinary.' },
  180: { label:'6 Months!',            emoji:'🔮', message:'Half a year. Transcendent discipline.' },
  365: { label:'One Full Year!',       emoji:'👑', message:'365 days. You have conquered yourself.' },
}

export default function MilestoneCelebration() {
  const [pending, setPending] = useState([])
  const [current, setCurrent] = useState(null)

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await axios.get('/api/reports/milestones')
        if (data.pending_milestones?.length > 0) {
          setPending(data.pending_milestones)
          setCurrent(data.pending_milestones[0])
        }
      } catch (e) {}
    }
    // Check after 2s to not block initial render
    const t = setTimeout(check, 2000)
    return () => clearTimeout(t)
  }, [])

  const dismiss = async () => {
    if (!current) return
    try { await axios.post('/api/reports/milestones/mark', { streak_day: current }) } catch (e) {}
    const next = pending.slice(1)
    setPending(next)
    setCurrent(next[0] || null)
  }

  const data = current ? MILESTONE_DATA[current] : null

  return (
    <AnimatePresence>
      {current && data && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}
          onClick={dismiss}>
          <motion.div initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.8, opacity:0 }}
            transition={{ type:'spring', stiffness:200, damping:20 }}
            onClick={e => e.stopPropagation()}
            style={{ background:'#08081a', border:'1px solid rgba(255,214,110,0.3)', borderRadius:'28px', padding:'40px 32px', textAlign:'center', maxWidth:'320px', width:'100%', position:'relative', overflow:'hidden', boxShadow:'0 0 80px rgba(255,214,110,0.1)' }}>

            {/* Shimmer top */}
            <motion.div animate={{ x:['-100%','200%'] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:1 }}
              style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,214,110,0.8),transparent)', pointerEvents:'none' }} />

            {/* Gold orb */}
            <div style={{ position:'absolute', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,214,110,0.08) 0%,transparent 70%)', top:'-60px', left:'50%', transform:'translateX(-50%)', pointerEvents:'none' }} />

            {/* Emoji */}
            <motion.div animate={{ scale:[1,1.15,1], rotate:[0,5,-5,0] }} transition={{ duration:2, repeat:3 }}
              style={{ fontSize:'64px', marginBottom:'20px', display:'block' }}>
              {data.emoji}
            </motion.div>

            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'11px', letterSpacing:'.25em', color:'rgba(255,214,110,0.5)', textTransform:'uppercase', marginBottom:'10px' }}>
              Milestone Reached
            </div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'28px', color:'var(--glow-gold)', fontWeight:300, marginBottom:'14px', textShadow:'0 0 30px rgba(255,214,110,0.4)' }}>
              {data.label}
            </div>
            <p style={{ fontSize:'15px', color:'var(--text-mid)', lineHeight:1.65, fontStyle:'italic', marginBottom:'28px' }}>
              {data.message}
            </p>

            {/* Streak badge */}
            <div style={{ display:'inline-block', padding:'8px 20px', background:'rgba(255,214,110,0.08)', border:'1px solid rgba(255,214,110,0.25)', borderRadius:'20px', marginBottom:'24px' }}>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'22px', color:'var(--glow-gold)', fontWeight:300 }}>{current} 🔥</span>
            </div>

            <br />
            <motion.button whileTap={{ scale:.97 }} onClick={dismiss}
              style={{ padding:'14px 36px', background:'rgba(255,214,110,0.1)', border:'1px solid rgba(255,214,110,0.3)', borderRadius:'14px', color:'var(--glow-gold)', fontSize:'12px', letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
              {pending.length > 1 ? `Claim (${pending.length - 1} more)` : 'Claim & Continue'}
            </motion.button>

            {/* Floating particles */}
            {[...Array(8)].map((_,i) => (
              <motion.div key={i}
                animate={{ y:[0, -80-i*10], x:[0, (i%2===0?1:-1)*20*(i+1)], opacity:[0,1,0], scale:[0,1,0] }}
                transition={{ duration:2, delay: i*0.15, repeat:Infinity, repeatDelay:1 }}
                style={{ position:'absolute', width:'6px', height:'6px', borderRadius:'50%', background:'var(--glow-gold)', left:`${20+i*10}%`, bottom:'20px', pointerEvents:'none' }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
