import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const MILESTONES = [1,3,7,14,21,30,45,60,75,90,120,180,365]
const MILESTONE_DATA = {
  1:   { label:'Day 1',        emoji:'🌱', desc:'You began. That matters most.' },
  3:   { label:'3 Days',       emoji:'🌿', desc:'The first real test passed.' },
  7:   { label:'1 Week',       emoji:'🔥', desc:'A week of discipline. You\'re building momentum.' },
  14:  { label:'2 Weeks',      emoji:'⚡', desc:'Neural pathways are starting to rewire.' },
  21:  { label:'21 Days',      emoji:'🌙', desc:'Habit formation is underway.' },
  30:  { label:'1 Month',      emoji:'💫', desc:'A full month. Your mind is stronger.' },
  45:  { label:'45 Days',      emoji:'🛡️', desc:'You are now resistant. The urges weaken.' },
  60:  { label:'2 Months',     emoji:'💎', desc:'Diamond mind. 60 days of mastery.' },
  75:  { label:'75 Days',      emoji:'🦅', desc:'You see the world differently now.' },
  90:  { label:'90 Days',      emoji:'🏆', desc:'Brahmacharya achieved. A new identity.' },
  120: { label:'4 Months',     emoji:'🌟', desc:'Rare. You are among the few.' },
  180: { label:'6 Months',     emoji:'🔮', desc:'Half a year. Transcendent discipline.' },
  365: { label:'1 Year',       emoji:'👑', desc:'A full year. You have conquered yourself.' },
}

export default function TimelinePage() {
  const [streak, setStreak] = useState({ current_streak:0, longest_streak:0 })
  const [achievements, setAchievements] = useState([])

  useEffect(() => {
    axios.get('/api/streaks').then(r => setStreak(r.data)).catch(() => {})
    axios.get('/api/achievements').then(r => setAchievements(r.data)).catch(() => {})
  }, [])

  const current = streak.current_streak || 0
  const longest = streak.longest_streak || 0
  const achievementKeys = new Set(achievements.filter(a => a.unlocked).map(a => a.achievement_key))

  const nextMilestone = MILESTONES.find(m => m > current) || null
  const daysToNext = nextMilestone ? nextMilestone - current : 0
  const progressToNext = nextMilestone
    ? ((current - (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] || 0)) /
       (nextMilestone - (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] || 0))) * 100
    : 100

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 20px 40px' }}>
      <div style={{ maxWidth:'400px', margin:'0 auto' }}>
        <div style={{ marginBottom:'24px' }}>
          <div style={{ fontSize:'10px', letterSpacing:'.2em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'6px' }}>Your Journey</div>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'26px', color:'var(--text-bright)', fontWeight:300 }}>Progress Timeline</div>
        </div>

        {/* Current status */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ padding:'22px', background:'rgba(0,232,122,0.05)', border:'1px solid rgba(0,232,122,0.18)', borderRadius:'18px', marginBottom:'20px', textAlign:'center' }}>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'64px', fontWeight:300, color:'var(--glow-green)', lineHeight:1, textShadow:'0 0 30px rgba(0,232,122,0.4)' }}>
            {current}
          </div>
          <div style={{ fontSize:'11px', color:'var(--text-muted)', letterSpacing:'.18em', textTransform:'uppercase', marginTop:'4px' }}>Days of discipline</div>
          {nextMilestone && (
            <div style={{ marginTop:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'var(--text-muted)', marginBottom:'6px' }}>
                <span>Current: {current}</span>
                <span>Next: {nextMilestone} days</span>
              </div>
              <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', overflow:'hidden' }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${progressToNext}%` }} transition={{ duration:.8, delay:.3 }}
                  style={{ height:'100%', background:'var(--glow-green)', borderRadius:'2px', boxShadow:'0 0 6px var(--glow-green)' }} />
              </div>
              <div style={{ fontSize:'12px', color:'rgba(0,232,122,0.6)', marginTop:'8px' }}>
                {daysToNext} day{daysToNext !== 1 ? 's' : ''} to {MILESTONE_DATA[nextMilestone]?.label}
              </div>
            </div>
          )}
        </motion.div>

        {/* Timeline */}
        <div style={{ position:'relative' }}>
          {/* Vertical line */}
          <div style={{ position:'absolute', left:'28px', top:0, bottom:0, width:'1px', background:'linear-gradient(180deg, var(--glow-green), rgba(255,255,255,0.05))', zIndex:0 }} />

          <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {MILESTONES.map((day, i) => {
              const data = MILESTONE_DATA[day]
              const reached = current >= day
              const isNext = day === nextMilestone
              const isCurrent = current === day

              return (
                <motion.div key={day} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.04 }}
                  style={{ display:'flex', gap:'18px', alignItems:'flex-start', padding:'12px 12px 12px 0', position:'relative', zIndex:1 }}>
                  {/* Node */}
                  <div style={{ width:'56px', flexShrink:0, display:'flex', justifyContent:'center' }}>
                    <motion.div
                      animate={isNext ? { scale:[1,1.08,1], boxShadow:['0 0 0px rgba(0,232,122,0)', '0 0 16px rgba(0,232,122,0.5)', '0 0 0px rgba(0,232,122,0)'] } : {}}
                      transition={{ duration:2.5, repeat:Infinity }}
                      style={{
                        width:'36px', height:'36px', borderRadius:'50%',
                        background: reached ? 'rgba(0,232,122,0.15)' : isNext ? 'rgba(255,214,110,0.1)' : 'rgba(255,255,255,0.04)',
                        border: reached ? '1.5px solid rgba(0,232,122,0.6)' : isNext ? '1.5px solid rgba(255,214,110,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px',
                        filter: !reached && !isNext ? 'grayscale(1) opacity(0.3)' : 'none',
                        boxShadow: reached ? '0 0 12px rgba(0,232,122,0.2)' : 'none'
                      }}>
                      {data.emoji}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, paddingTop:'6px', opacity: !reached && !isNext ? 0.4 : 1 }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'3px' }}>
                      <span style={{ fontSize:'14px', fontWeight:500, color: reached ? 'var(--text-bright)' : isNext ? 'var(--glow-gold)' : 'var(--text-muted)' }}>
                        {data.label}
                      </span>
                      {reached && <span style={{ fontSize:'10px', color:'var(--glow-green)', letterSpacing:'.1em' }}>✓ REACHED</span>}
                      {isNext && <span style={{ fontSize:'10px', color:'var(--glow-gold)', letterSpacing:'.1em' }}>◉ NEXT</span>}
                    </div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)', lineHeight:1.5 }}>{data.desc}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Best ever */}
        {longest > current && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
            style={{ marginTop:'20px', padding:'16px', background:'rgba(255,214,110,0.05)', border:'1px solid rgba(255,214,110,0.15)', borderRadius:'14px', textAlign:'center' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,214,110,0.5)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'6px' }}>Your Best Streak</div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'32px', color:'var(--glow-gold)', fontWeight:300 }}>{longest} days</div>
            <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'4px' }}>You've done it before. You can do it again.</div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
