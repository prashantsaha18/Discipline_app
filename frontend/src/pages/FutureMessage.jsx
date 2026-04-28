import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function FutureMessage() {
  const [message, setMessage] = useState('')
  const [existing, setExisting] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    axios.get('/api/messages/active').then(r => { if (r.data) setExisting(r.data) }).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!message.trim()) return
    setSaving(true)
    try {
      const { data } = await axios.post('/api/messages', { message })
      setExisting(data)
      setSaved(true)
      setEditing(false)
      setMessage('')
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {}
    setSaving(false)
  }

  const charLimit = 280
  const remaining = charLimit - message.length

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 24px 40px', position: 'relative' }}>
      {/* Ambient */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(255,214,110,0.06) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '380px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(255,214,110,0.5)', textTransform: 'uppercase', marginBottom: '14px' }}>
            Future Self
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', fontWeight: 300, color: 'var(--text-bright)', marginBottom: '10px' }}>
            Write to who you're becoming.
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            This message will appear during urge mode — a letter from your wiser self.
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Show existing message */}
          {existing && !editing && (
            <motion.div key="existing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '28px', background: 'rgba(255,214,110,0.06)',
                border: '1px solid rgba(255,214,110,0.2)', borderRadius: '20px',
                marginBottom: '20px', position: 'relative',
                boxShadow: '0 0 40px rgba(255,214,110,0.04)'
              }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,214,110,0.4)', textTransform: 'uppercase', marginBottom: '14px' }}>
                Your message · active
              </div>
              <motion.div animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 4, repeat: Infinity }}>
                <p style={{ fontSize: '16px', color: 'rgba(255,214,110,0.9)', fontStyle: 'italic', lineHeight: 1.7, fontFamily: 'Cormorant Garamond, serif' }}>
                  "{existing.message}"
                </p>
              </motion.div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '16px' }}>
                Written {new Date(existing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>

              {/* Decorative corner */}
              <div style={{ position: 'absolute', top: '14px', right: '16px', fontSize: '20px', opacity: 0.3 }}>◇</div>
            </motion.div>
          )}

          {saved && !editing && (
            <motion.div key="saved" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.2)', borderRadius: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: 'var(--glow-green)' }}>✓ Saved — it will appear during urge mode</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Write new */}
        {(!existing || editing) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <textarea
              value={message}
              onChange={e => message.length < charLimit + 1 && setMessage(e.target.value)}
              placeholder="Dear future me... I'm writing this on day X. You've come so far. Remember why you started. You don't need to escape — you need to be present."
              style={{
                width: '100%', padding: '20px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,214,110,0.15)', borderRadius: '16px',
                color: 'var(--text-bright)', fontSize: '15px', lineHeight: 1.7,
                resize: 'none', height: '180px', outline: 'none',
                fontFamily: 'Cormorant Garamond, serif',
                caretColor: 'var(--glow-gold)', marginBottom: '12px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: remaining < 40 ? 'rgba(255,100,100,0.7)' : 'var(--text-muted)' }}>
                {remaining} left
              </span>
              {existing && editing && (
                <button onClick={() => { setEditing(false); setMessage('') }} style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer'
                }}>Cancel</button>
              )}
            </div>

            <motion.button whileTap={message.trim() ? { scale: 0.97 } : {}}
              onClick={message.trim() ? handleSave : undefined}
              style={{
                width: '100%', padding: '18px',
                background: message.trim() ? 'rgba(255,214,110,0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${message.trim() ? 'rgba(255,214,110,0.35)' : 'var(--border)'}`,
                borderRadius: '16px', color: message.trim() ? 'var(--glow-gold)' : 'var(--text-muted)',
                fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: message.trim() ? 'pointer' : 'default', transition: 'all 0.3s',
                opacity: message.trim() ? 1 : 0.5
              }}>
              {saving ? 'Sealing...' : '◇ Seal the Letter'}
            </motion.button>
          </motion.div>
        )}

        {existing && !editing && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditing(true)}
            style={{
              width: '100%', padding: '14px', marginTop: '12px',
              background: 'transparent', border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: '14px', color: 'var(--text-muted)',
              fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer'
            }}>
            ✎ Write New Letter
          </motion.button>
        )}

        {/* Info card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ marginTop: '32px', padding: '18px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            💡 <span style={{ color: 'var(--text-mid)' }}>This message appears as a glowing card</span> during urge mode — a reminder from the person you're working to become. Make it personal, honest, and compassionate.
          </div>
        </motion.div>
      </div>
    </div>
  )
}
