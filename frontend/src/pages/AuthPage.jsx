import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    if (!form.email.trim() || !form.password) { setError('All fields required'); return }
    if (mode === 'register' && !form.username.trim()) { setError('Username is required'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.username, form.email, form.password)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '11px', color: 'var(--text-bright)', fontSize: '14px',
    outline: 'none', fontFamily: 'DM Sans, sans-serif', caretColor: 'var(--glow-green)',
    transition: 'border-color 0.2s'
  }

  return (
    <div style={{
      height: '100dvh', background: 'var(--bg-void)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', width: '480px', height: '480px', borderRadius: '50%', background: 'rgba(0,232,122,0.04)', filter: 'blur(100px)', top: '-200px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,214,110,0.03)', filter: 'blur(80px)', bottom: '-60px', right: '-80px', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: '340px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <motion.div animate={{ opacity: [0.65, 1, 0.65] }} transition={{ duration: 4.5, repeat: Infinity }}
            style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: 'var(--glow-gold)', letterSpacing: '0.18em', marginBottom: '6px' }}>
            BRAHMACHARYA
          </motion.div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.14em' }}>INNER CONTROL</div>
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ width: '44px', height: '44px', borderRadius: '50%', margin: '18px auto 0', background: 'radial-gradient(circle, rgba(0,232,122,0.35) 0%, transparent 70%)', border: '1px solid rgba(0,232,122,0.25)' }} />
        </div>

        <div style={{ background: 'rgba(13,13,24,0.85)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '22px', padding: '28px 24px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '11px', padding: '3px' }}>
            {[['login', 'Sign In'], ['register', 'Begin Journey']].map(([m, lbl]) => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1, padding: '9px', border: 'none', borderRadius: '9px', cursor: 'pointer',
                  background: mode === m ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: mode === m ? 'var(--text-bright)' : 'var(--text-muted)',
                  fontSize: '12px', letterSpacing: '0.04em', transition: 'all 0.2s',
                  fontFamily: 'DM Sans, sans-serif'
                }}>
                {lbl}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div key="uname" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <input value={form.username} onChange={set('username')} placeholder="Username"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,232,122,0.3)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </motion.div>
              )}
            </AnimatePresence>

            <input value={form.email} onChange={set('email')} placeholder="Email" type="email" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(0,232,122,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

            <input value={form.password} onChange={set('password')} placeholder="Password" type="password" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(0,232,122,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ padding: '10px 14px', background: 'rgba(255,80,80,0.07)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '9px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,130,130,0.9)' }}>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
              style={{
                width: '100%', padding: '16px', marginTop: '4px',
                background: loading ? 'rgba(0,232,122,0.04)' : 'rgba(0,232,122,0.1)',
                border: '1px solid rgba(0,232,122,0.28)', borderRadius: '13px',
                color: 'var(--glow-green)', fontSize: '12px', letterSpacing: '0.15em',
                textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
                fontFamily: 'DM Sans, sans-serif', boxShadow: '0 0 25px rgba(0,232,122,0.05)',
                transition: 'all 0.3s'
              }}>
              {loading ? '...' : mode === 'login' ? 'Enter Sanctuary' : 'Begin My Journey'}
            </motion.button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '26px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'Cormorant Garamond, serif' }}>
          "The mind is everything. What you think, you become."
        </p>
      </motion.div>
    </div>
  )
}
