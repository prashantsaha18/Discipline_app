import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path:'/',            icon:'◎', label:'Home' },
  { path:'/habits',     icon:'◈', label:'Habits' },
  { path:'/journal',    icon:'◇', label:'Journal' },
  { path:'/insights',   icon:'◉', label:'Insights' },
  { path:'/leaderboard',icon:'◆', label:'Board' },
]

const MORE_ITEMS = [
  { path:'/quotes',       label:'💬 Daily Quotes' },
  { path:'/affirmations', label:'🙏 Affirmations' },
  { path:'/sleep',        label:'😴 Sleep Tracker' },
  { path:'/report',       label:'📊 Weekly Report' },
  { path:'/timeline',     label:'🧭 My Timeline' },
  { path:'/breathing',    label:'🌬️ Breathe' },
  { path:'/settings',     label:'⚙️ Settings' },
]

export default function NavLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = MORE_ITEMS.some(i => i.path === location.pathname)

  return (
    <div style={{ background:'var(--bg-void)', height:'100dvh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 20px', borderBottom:'1px solid var(--border)', flexShrink:0, background:'rgba(5,5,10,0.92)', backdropFilter:'blur(20px)', zIndex:10 }}>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'17px', color:'var(--glow-gold)', letterSpacing:'.14em' }}>
          BRAHMACHARYA
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <button onClick={() => navigate('/sos')} title="SOS Mode"
            style={{ padding:'6px 10px', background:'rgba(255,80,80,0.08)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:'8px', color:'rgba(255,100,100,0.8)', fontSize:'11px', cursor:'pointer', letterSpacing:'.08em', fontFamily:'DM Sans, sans-serif' }}>
            🆘 SOS
          </button>
          <button onClick={() => navigate('/profile')}
            style={{ width:'30px', height:'30px', borderRadius:'50%', background:'rgba(0,232,122,0.1)', border:'1px solid rgba(0,232,122,0.25)', color:'var(--glow-green)', fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
          </button>
        </div>
      </div>

      {/* More drawer */}
      {showMore && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
          style={{ position:'absolute', top:'56px', right:'16px', background:'#0d0d1e', border:'1px solid var(--border)', borderRadius:'16px', padding:'8px', zIndex:50, boxShadow:'0 8px 32px rgba(0,0,0,0.6)', minWidth:'200px' }}>
          {MORE_ITEMS.map(item => (
            <button key={item.path} onClick={() => { navigate(item.path); setShowMore(false) }}
              style={{ display:'block', width:'100%', padding:'11px 14px', background: location.pathname===item.path ? 'rgba(0,232,122,0.08)' : 'none', border:'none', borderRadius:'10px', color: location.pathname===item.path ? 'var(--glow-green)' : 'var(--text-mid)', fontSize:'13px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', textAlign:'left' }}>
              {item.label}
            </button>
          ))}
        </motion.div>
      )}
      {showMore && <div onClick={() => setShowMore(false)} style={{ position:'fixed', inset:0, zIndex:40 }} />}

      {/* Main content */}
      <div style={{ flex:1, overflow:'auto', position:'relative' }}>
        <Outlet />
      </div>

      {/* Bottom nav */}
      <div style={{ display:'flex', borderTop:'1px solid var(--border)', background:'rgba(5,5,10,0.96)', backdropFilter:'blur(20px)', flexShrink:0, padding:'6px 0', paddingBottom:'calc(6px + env(safe-area-inset-bottom, 0px))', position:'relative' }}>
        {navItems.map(item => {
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => { navigate(item.path); setShowMore(false) }} style={{ flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'6px 0', position:'relative' }}>
              {active && (
                <motion.div layoutId="nav-pill" style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'32px', height:'2px', background:'var(--glow-green)', borderRadius:'0 0 2px 2px', boxShadow:'0 0 8px var(--glow-green)' }} />
              )}
              <motion.span animate={{ color: active ? 'var(--glow-green)' : 'var(--text-muted)' }} transition={{ duration:.2 }} style={{ fontSize:'18px', lineHeight:1 }}>
                {item.icon}
              </motion.span>
              <span style={{ fontSize:'9px', letterSpacing:'.08em', textTransform:'uppercase', color: active ? 'var(--glow-green)' : 'var(--text-muted)', fontFamily:'DM Sans, sans-serif', transition:'color .2s' }}>
                {item.label}
              </span>
            </button>
          )
        })}
        {/* More button */}
        <button onClick={() => setShowMore(p => !p)} style={{ flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'6px 0', position:'relative' }}>
          {(showMore || isMoreActive) && (
            <motion.div layoutId="nav-pill-more" style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'32px', height:'2px', background:'rgba(255,214,110,0.7)', borderRadius:'0 0 2px 2px', boxShadow:'0 0 8px rgba(255,214,110,0.5)' }} />
          )}
          <span style={{ fontSize:'18px', lineHeight:1, color: (showMore || isMoreActive) ? 'var(--glow-gold)' : 'var(--text-muted)' }}>⋯</span>
          <span style={{ fontSize:'9px', letterSpacing:'.08em', textTransform:'uppercase', color:(showMore||isMoreActive) ? 'var(--glow-gold)' : 'var(--text-muted)', fontFamily:'DM Sans, sans-serif' }}>More</span>
        </button>
      </div>
    </div>
  )
}
