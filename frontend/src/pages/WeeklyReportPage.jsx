import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const STATUS_COLOR = { discipline:'rgba(0,232,122,0.75)', relapse:'rgba(255,70,70,0.65)', frozen:'rgba(100,180,255,0.55)', neutral:'rgba(255,255,255,0.08)' }

const Gauge = ({ value, max, color, label, sub }) => {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ position:'relative', width:'72px', height:'72px', margin:'0 auto 8px' }}>
        <svg viewBox="0 0 72 72" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx="36" cy="36" r="30" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${2*Math.PI*30}`}
            strokeDashoffset={`${2*Math.PI*30*(1-pct/100)}`}
            strokeLinecap="round"
            style={{ filter:`drop-shadow(0 0 4px ${color})`, transition:'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cormorant Garamond, serif', fontSize:'18px', fontWeight:300, color }}>
          {Math.round(pct)}%
        </div>
      </div>
      <div style={{ fontSize:'12px', color:'var(--text-bright)' }}>{label}</div>
      <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'2px' }}>{sub}</div>
    </div>
  )
}

export default function WeeklyReportPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/reports/weekly').then(r => { setReport(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
      <motion.div animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:2, repeat:Infinity }}
        style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'18px', color:'var(--text-muted)' }}>Compiling report...</motion.div>
    </div>
  )

  if (!report) return null

  const { streak, success_rate, discipline_days, total_days_logged, daily_logs,
    urge_stats, habit_stats, top_moods, sleep_stats, ritual_stats } = report

  const MOOD_EMOJI = { peaceful:'🌿', focused:'🎯', anxious:'⚡', bored:'🌑', stressed:'🔥', tired:'🌙', angry:'💢', grateful:'🙏' }

  const radarData = [
    { subject:'Streak', A: Math.min((streak.current_streak||0)/30*100, 100) },
    { subject:'Urges', A: urge_stats?.total_urges > 0 ? Math.round((+urge_stats.survived/+urge_stats.total_urges)*100) : 100 },
    { subject:'Habits', A: habit_stats?.length > 0 ? Math.round(habit_stats.reduce((s,h) => s + (+h.done_this_week||0), 0) / Math.max(habit_stats.reduce((s,h) => s + Math.max(+h.logged_this_week||0, 7), 0), 1) * 100) : 0 },
    { subject:'Rituals', A: ritual_stats?.total_days > 0 ? Math.round((+ritual_stats.mornings_done/+ritual_stats.total_days)*100) : 0 },
    { subject:'Sleep', A: sleep_stats?.avg_quality ? Math.round((+sleep_stats.avg_quality/5)*100) : 0 },
    { subject:'Focus', A: success_rate },
  ]

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 20px 40px' }}>
      <div style={{ maxWidth:'400px', margin:'0 auto' }}>
        <div style={{ marginBottom:'22px' }}>
          <div style={{ fontSize:'10px', letterSpacing:'.2em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'6px' }}>Last 7 Days</div>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'26px', color:'var(--text-bright)', fontWeight:300 }}>Weekly Report</div>
        </div>

        {/* Radar */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ padding:'20px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px', marginBottom:'12px' }}>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'8px' }}>Discipline Score</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:'rgba(255,255,255,0.4)' }} />
              <Radar dataKey="A" stroke="var(--glow-green)" fill="rgba(0,232,122,0.12)" strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 7-day log */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
          style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px', marginBottom:'12px' }}>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'14px' }}>
            This Week · {discipline_days}/{total_days_logged} days clean
          </div>
          <div style={{ display:'flex', gap:'6px', justifyContent:'center' }}>
            {Array.from({ length:7 }).map((_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (6 - i))
              const ds = d.toLocaleDateString('en-CA')
              const log = daily_logs.find(l => l.log_date?.slice(0,10) === ds)
              const status = log?.status || 'neutral'
              return (
                <div key={i} style={{ textAlign:'center', flex:1 }}>
                  <div style={{ fontSize:'9px', color:'var(--text-muted)', marginBottom:'6px' }}>{DOW[d.getDay()]}</div>
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay: i*0.05, type:'spring' }}
                    style={{ width:'100%', aspectRatio:'1', borderRadius:'8px', background:STATUS_COLOR[status], margin:'0 auto', boxShadow: status==='discipline' ? '0 0 8px rgba(0,232,122,0.3)' : 'none' }} />
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Gauges */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
          style={{ padding:'20px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px', marginBottom:'12px' }}>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'18px' }}>Key Metrics</div>
          <div style={{ display:'flex', justifyContent:'space-around' }}>
            <Gauge value={success_rate} max={100} color="var(--glow-green)" label="Success" sub={`${discipline_days}/${total_days_logged} days`} />
            {urge_stats?.total_urges > 0 && (
              <Gauge value={+urge_stats.survived} max={+urge_stats.total_urges} color="rgba(255,140,80,0.9)" label="Urges Beat" sub={`${urge_stats.survived}/${urge_stats.total_urges}`} />
            )}
            {ritual_stats?.total_days > 0 && (
              <Gauge value={+ritual_stats.mornings_done} max={+ritual_stats.total_days} color="var(--glow-gold)" label="Mornings" sub={`${ritual_stats.mornings_done}/${ritual_stats.total_days}`} />
            )}
          </div>
        </motion.div>

        {/* Habit performance */}
        {habit_stats?.length > 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.16 }}
            style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px', marginBottom:'12px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'14px' }}>Habit Performance</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {habit_stats.slice(0,5).map((h,i) => {
                const pct = +h.logged_this_week > 0 ? Math.round((+h.done_this_week / +h.logged_this_week)*100) : 0
                return (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'12px', color:'var(--text-bright)' }}>{h.emoji} {h.name}</span>
                      <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>{h.done_this_week}/{h.logged_this_week||7}d</span>
                    </div>
                    <div style={{ height:'3px', background:'rgba(255,255,255,0.05)', borderRadius:'2px', overflow:'hidden' }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay:0.3+i*0.05 }}
                        style={{ height:'100%', background:'rgba(0,232,122,0.6)', borderRadius:'2px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Top moods */}
        {top_moods?.length > 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px', marginBottom:'12px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'12px' }}>Mood This Week</div>
            <div style={{ display:'flex', gap:'10px' }}>
              {top_moods.map((m,i) => (
                <div key={i} style={{ textAlign:'center', flex:1, padding:'12px 6px', background:'rgba(255,255,255,0.03)', borderRadius:'12px', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'22px' }}>{MOOD_EMOJI[m.mood] || '○'}</div>
                  <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'4px', textTransform:'capitalize' }}>{m.mood}</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'16px', color:'var(--text-mid)', marginTop:'2px' }}>{m.count}×</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sleep summary */}
        {sleep_stats && +sleep_stats.nights > 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.24 }}
            style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'12px' }}>Sleep This Week</div>
            <div style={{ display:'flex', gap:'16px', justifyContent:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'28px', fontWeight:300, color:'rgba(100,180,255,0.9)' }}>
                  {(+sleep_stats.avg_hours||0).toFixed(1)}h
                </div>
                <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>Avg Sleep</div>
              </div>
              <div style={{ width:'1px', background:'var(--border)' }} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'28px', fontWeight:300, color:'var(--glow-gold)' }}>
                  {(+sleep_stats.avg_quality||0).toFixed(1)}
                </div>
                <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>Avg Quality</div>
              </div>
              <div style={{ width:'1px', background:'var(--border)' }} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'28px', fontWeight:300, color:'var(--glow-green)' }}>
                  {sleep_stats.good_nights}
                </div>
                <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>Good Nights</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
