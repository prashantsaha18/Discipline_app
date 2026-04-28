import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const TZ_LIST = [
  'Asia/Kolkata','Asia/Dubai','Asia/Singapore','Asia/Tokyo',
  'Europe/London','Europe/Berlin','America/New_York','America/Los_Angeles',
  'America/Chicago','Australia/Sydney','UTC'
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ display_name: user?.display_name || '', timezone: user?.timezone || 'UTC', is_anonymous: false })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.put('/api/auth/profile', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {}
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '13px 15px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '11px', color: 'var(--text-bright)', fontSize: '14px',
    outline: 'none', fontFamily: 'DM Sans, sans-serif'
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 20px 40px' }}>
      <div style={{ maxWidth: '380px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Account</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', color: 'var(--text-bright)', fontWeight: 300 }}>Profile</div>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'var(--glow-green)', fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, flexShrink: 0 }}>
            {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '16px', color: 'var(--text-bright)', fontWeight: 500 }}>{user?.display_name || user?.username}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>@{user?.username}</div>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Display Name</label>
            <input value={form.display_name} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} style={inputStyle} placeholder="Your display name" />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Timezone</label>
            <select value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {TZ_LIST.map(tz => <option key={tz} value={tz} style={{ background: '#0d0d18' }}>{tz}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '11px' }}>
            <input type="checkbox" id="anon" checked={form.is_anonymous} onChange={e => setForm(p => ({ ...p, is_anonymous: e.target.checked }))}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--glow-green)' }} />
            <label htmlFor="anon" style={{ fontSize: '13px', color: 'var(--text-mid)', cursor: 'pointer' }}>
              Show as "Anonymous Warrior" on leaderboard
            </label>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
          style={{
            width: '100%', padding: '15px', marginBottom: '12px',
            background: 'rgba(0,232,122,0.09)', border: '1px solid rgba(0,232,122,0.27)',
            borderRadius: '14px', color: saved ? 'var(--glow-green)' : 'var(--glow-green)',
            fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.3s'
          }}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </motion.button>

        {/* Quick links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {[
            { label: '🏆 Achievements', path: '/achievements' },
            { label: '◈ Insights',      path: '/insights' },
            { label: '◇ Future Letter', path: '/message' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{
                width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)', borderRadius: '12px',
                color: 'var(--text-mid)', fontSize: '13px', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
              {item.label} <span style={{ opacity: 0.4 }}>→</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        {!showLogout ? (
          <button onClick={() => setShowLogout(true)} style={{ display: 'block', margin: '0 auto', background: 'none', border: 'none', color: 'rgba(255,80,80,0.3)', fontSize: '12px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
            Sign Out
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '16px', background: 'rgba(255,80,80,0.04)', border: '1px solid rgba(255,80,80,0.16)', borderRadius: '13px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>Sign out of Brahmacharya?</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, padding: '11px', background: 'none', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
              <button onClick={logout} style={{ flex: 1, padding: '11px', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: '10px', color: 'rgba(255,110,110,0.9)', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Sign Out</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
