import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const Toggle = ({ value, onChange, label, desc }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'13px' }}>
    <div>
      <div style={{ fontSize:'13px', color:'var(--text-bright)' }}>{label}</div>
      {desc && <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>{desc}</div>}
    </div>
    <div onClick={() => onChange(!value)} style={{ width:'44px', height:'24px', borderRadius:'12px', background: value ? 'rgba(0,232,122,0.35)' : 'rgba(255,255,255,0.08)', border:`1px solid ${value ? 'rgba(0,232,122,0.6)' : 'rgba(255,255,255,0.1)'}`, cursor:'pointer', position:'relative', transition:'all .3s', flexShrink:0 }}>
      <motion.div animate={{ left: value ? '22px' : '2px' }} transition={{ type:'spring', stiffness:400, damping:30 }}
        style={{ position:'absolute', top:'2px', width:'18px', height:'18px', borderRadius:'50%', background: value ? 'var(--glow-green)' : 'rgba(255,255,255,0.4)', boxShadow: value ? '0 0 6px rgba(0,232,122,0.6)' : 'none' }} />
    </div>
  </div>
)

export default function SettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({ urge_timer_minutes:10, theme_intensity:'standard', show_streak_on_lock:true, daily_reminder_hour:21, quote_category:'all' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    axios.get('/api/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.put('/api/settings', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {}
    setSaving(false)
  }

  const sliderStyle = { width:'100%', accentColor:'var(--glow-green)', cursor:'pointer' }
  const selectStyle = { width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'11px', color:'var(--text-bright)', fontSize:'13px', outline:'none', fontFamily:'DM Sans, sans-serif', cursor:'pointer', colorScheme:'dark' }

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 20px 40px' }}>
      <div style={{ maxWidth:'400px', margin:'0 auto' }}>
        <div style={{ marginBottom:'24px' }}>
          <div style={{ fontSize:'10px', letterSpacing:'.2em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'6px' }}>Preferences</div>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'26px', color:'var(--text-bright)', fontWeight:300 }}>Settings</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
          {/* Urge timer */}
          <div style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'14px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'14px' }}>⚡ Urge Mode</div>
            <div style={{ marginBottom:'10px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'13px', color:'var(--text-bright)' }}>Timer Duration</span>
                <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'18px', color:'var(--glow-green)' }}>{settings.urge_timer_minutes} min</span>
              </div>
              <input type="range" min={1} max={30} value={settings.urge_timer_minutes} onChange={e => set('urge_timer_minutes', +e.target.value)} style={sliderStyle} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'var(--text-muted)' }}><span>1 min</span><span>30 min</span></div>
            </div>
          </div>

          {/* Quotes */}
          <div style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'14px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'12px' }}>💬 Daily Quote</div>
            <div style={{ fontSize:'13px', color:'var(--text-bright)', marginBottom:'8px' }}>Preferred Category</div>
            <select value={settings.quote_category} onChange={e => set('quote_category', e.target.value)} style={selectStyle}>
              {['all','discipline','mind','strength','brahmacharya','resilience','focus'].map(c => (
                <option key={c} value={c} style={{ background:'#0d0d18', textTransform:'capitalize' }}>{c}</option>
              ))}
            </select>
          </div>

          {/* Reminder */}
          <div style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'14px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'12px' }}>🔔 Reminder</div>
            <div style={{ marginBottom:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'13px', color:'var(--text-bright)' }}>Evening Check-in Hour</span>
                <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'18px', color:'var(--glow-gold)' }}>{settings.daily_reminder_hour}:00</span>
              </div>
              <input type="range" min={18} max={23} value={settings.daily_reminder_hour} onChange={e => set('daily_reminder_hour', +e.target.value)} style={sliderStyle} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'var(--text-muted)' }}><span>6 PM</span><span>11 PM</span></div>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'2px' }}>🔧 Display</div>
            <Toggle value={settings.show_streak_on_lock} onChange={v => set('show_streak_on_lock', v)} label="Show Streak Counter" desc="Display current streak prominently on home screen" />
          </div>

          {/* Quick links */}
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'2px' }}>🔗 Quick Access</div>
            {[['👤 Profile', '/profile'], ['🏆 Achievements', '/achievements'], ['📊 Weekly Report', '/report'], ['😴 Sleep Tracker', '/sleep']].map(([l, p]) => (
              <button key={p} onClick={() => navigate(p)} style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'12px', color:'var(--text-mid)', fontSize:'13px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                {l} <span style={{ opacity:.4 }}>→</span>
              </button>
            ))}
          </div>

          <motion.button whileTap={{ scale:.97 }} onClick={handleSave} disabled={saving}
            style={{ width:'100%', padding:'16px', background:'rgba(0,232,122,0.09)', border:'1px solid rgba(0,232,122,0.27)', borderRadius:'14px', color:'var(--glow-green)', fontSize:'12px', letterSpacing:'.12em', textTransform:'uppercase', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
            {saving ? '...' : saved ? '✓ Saved' : 'Save Settings'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
