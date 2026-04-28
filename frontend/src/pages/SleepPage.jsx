import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const STARS = [1,2,3,4,5]
const QUALITY_LABEL = { 1:'Poor', 2:'Fair', 3:'Okay', 4:'Good', 5:'Great' }
const QUALITY_COLOR = { 1:'rgba(255,80,80,0.8)', 2:'rgba(255,140,60,0.8)', 3:'rgba(255,214,110,0.8)', 4:'rgba(100,220,160,0.8)', 5:'rgba(0,232,122,0.9)' }

const SleepTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0d0d18', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'8px 12px' }}>
      <div style={{ fontSize:'11px', color:'var(--text-muted)', marginBottom:'3px' }}>{label}</div>
      <div style={{ fontSize:'14px', color:'rgba(100,180,255,0.9)' }}>{payload[0]?.value}h</div>
    </div>
  )
}

export default function SleepPage() {
  const [form, setForm] = useState({ bedtime:'22:30', wake_time:'06:30', quality:4, notes:'' })
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [today, setToday] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    axios.get('/api/sleep/today').then(r => {
      if (r.data) { setToday(r.data); setForm({ bedtime: r.data.bedtime||'22:30', wake_time: r.data.wake_time||'06:30', quality: r.data.quality||4, notes: r.data.notes||'' }) }
    }).catch(() => {})
    axios.get('/api/sleep/history').then(r => setHistory(r.data)).catch(() => {})
    axios.get('/api/sleep/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const calcDuration = (bed, wake) => {
    try {
      const [bh, bm] = bed.split(':').map(Number)
      const [wh, wm] = wake.split(':').map(Number)
      let diff = (wh * 60 + wm) - (bh * 60 + bm)
      if (diff < 0) diff += 1440
      return +(diff / 60).toFixed(2)
    } catch { return null }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const duration = calcDuration(form.bedtime, form.wake_time)
      await axios.post('/api/sleep', { ...form, duration_hours: duration })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      axios.get('/api/sleep/history').then(r => setHistory(r.data))
      axios.get('/api/sleep/stats').then(r => setStats(r.data))
    } catch (e) {}
    setSaving(false)
  }

  const chartData = [...history].reverse().slice(-14).map(h => ({
    date: new Date(h.log_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
    hours: +(+h.duration_hours||0).toFixed(1),
    quality: h.quality
  }))

  const duration = calcDuration(form.bedtime, form.wake_time)

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 20px 40px' }}>
      <div style={{ maxWidth:'400px', margin:'0 auto' }}>
        <div style={{ marginBottom:'22px' }}>
          <div style={{ fontSize:'10px', letterSpacing:'.2em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'6px' }}>Recovery</div>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'26px', color:'var(--text-bright)', fontWeight:300 }}>Sleep Tracker</div>
        </div>

        {/* Stats row */}
        {stats && +stats.total_logs > 0 && (
          <div style={{ display:'flex', gap:0, marginBottom:'20px', overflow:'hidden', borderRadius:'14px', border:'1px solid var(--border)' }}>
            {[
              { val: stats.avg_quality ? (+stats.avg_quality).toFixed(1) : '—', lbl:'Avg Quality', color:'var(--glow-gold)' },
              { val: stats.avg_hours ? `${(+stats.avg_hours).toFixed(1)}h` : '—', lbl:'Avg Sleep', color:'rgba(100,180,255,0.9)' },
              { val: stats.good_nights || 0, lbl:'Good Nights', color:'var(--glow-green)' },
            ].map(({ val, lbl, color }, i, arr) => (
              <div key={lbl} style={{ flex:1, padding:'14px 10px', textAlign:'center', borderRight: i<arr.length-1 ? '1px solid var(--border)' : 'none', background:'rgba(255,255,255,0.01)' }}>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'24px', fontWeight:300, color, lineHeight:1 }}>{val}</div>
                <div style={{ fontSize:'9px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.1em', marginTop:'4px' }}>{lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* Log form */}
        <div style={{ padding:'20px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px', marginBottom:'16px' }}>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'16px' }}>
            {today ? 'Update Tonight' : 'Log Last Night'}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
            {[['bedtime','Bedtime'],['wake_time','Wake Time']].map(([k,l]) => (
              <div key={k}>
                <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'6px' }}>{l}</div>
                <input type="time" value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                  style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'var(--text-bright)', fontSize:'16px', outline:'none', fontFamily:'DM Sans, sans-serif', colorScheme:'dark' }} />
              </div>
            ))}
          </div>

          {duration !== null && (
            <div style={{ textAlign:'center', marginBottom:'14px', fontSize:'13px', color:'rgba(100,180,255,0.8)' }}>
              Duration: <strong>{duration}h</strong>
            </div>
          )}

          <div style={{ marginBottom:'14px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'10px' }}>Sleep Quality</div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'center' }}>
              {STARS.map(s => (
                <motion.button key={s} whileTap={{ scale:0.9 }} onClick={() => setForm(p => ({ ...p, quality:s }))}
                  style={{
                    width:'44px', height:'44px', borderRadius:'50%', border:`1.5px solid ${form.quality>=s ? QUALITY_COLOR[s] : 'rgba(255,255,255,0.1)'}`,
                    background: form.quality>=s ? `${QUALITY_COLOR[s]}15` : 'transparent',
                    cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .2s', boxShadow: form.quality===s ? `0 0 12px ${QUALITY_COLOR[s]}40` : 'none'
                  }}>
                  ★
                </motion.button>
              ))}
            </div>
            <div style={{ textAlign:'center', marginTop:'8px', fontSize:'12px', color: QUALITY_COLOR[form.quality] }}>
              {QUALITY_LABEL[form.quality]}
            </div>
          </div>

          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes:e.target.value }))}
            placeholder="Any dreams, disturbances, or notes..."
            style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', color:'var(--text-bright)', fontSize:'13px', resize:'none', height:'70px', outline:'none', fontFamily:'DM Sans, sans-serif', marginBottom:'14px' }}
          />

          <motion.button whileTap={{ scale:0.97 }} onClick={handleSave} disabled={saving}
            style={{ width:'100%', padding:'14px', background:'rgba(100,180,255,0.08)', border:'1px solid rgba(100,180,255,0.25)', borderRadius:'13px', color:'rgba(100,180,255,0.9)', fontSize:'12px', letterSpacing:'.12em', textTransform:'uppercase', cursor:'pointer', fontFamily:'DM Sans, sans-serif', transition:'all .3s' }}>
            {saving ? '...' : saved ? '✓ Saved' : today ? '↻ Update Log' : '😴 Log Sleep'}
          </motion.button>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'14px' }}>
              Sleep Duration (14 days)
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData} margin={{ top:0, right:0, left:-28, bottom:0 }}>
                <defs>
                  <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(100,180,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(100,180,255,0.02)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize:8, fill:'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:8, fill:'rgba(255,255,255,0.2)' }} domain={[0,'auto']} axisLine={false} tickLine={false} />
                <Tooltip content={<SleepTooltip />} />
                <Area type="monotone" dataKey="hours" stroke="rgba(100,180,255,0.6)" fill="url(#sleepGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
