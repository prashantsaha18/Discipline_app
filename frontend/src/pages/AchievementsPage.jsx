import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/achievements').then(r => { setAchievements(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const unlocked = achievements.filter(a => a.unlocked)
  const locked = achievements.filter(a => !a.unlocked)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 20px 40px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Your Journey</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', color: 'var(--text-bright)', fontWeight: 300 }}>
            Achievements
          </div>
          {!loading && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {unlocked.length} of {achievements.length} unlocked
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ color: 'var(--text-muted)', fontFamily: 'Cormorant Garamond, serif', fontSize: '18px' }}>
              Loading...
            </motion.div>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }}
                animate={{ width: `${achievements.length ? (unlocked.length / achievements.length) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: 'var(--glow-gold)', borderRadius: '2px', boxShadow: '0 0 6px var(--glow-gold)' }}
              />
            </div>

            {/* Unlocked */}
            {unlocked.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,214,110,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Unlocked
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {unlocked.map((a, i) => (
                    <motion.div key={a.key} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 14px',
                        background: 'rgba(255,214,110,0.06)', border: '1px solid rgba(255,214,110,0.22)',
                        borderRadius: '14px', boxShadow: '0 0 20px rgba(255,214,110,0.04)',
                        position: 'relative', overflow: 'hidden'
                      }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,214,110,0.35), transparent)' }} />
                      <div style={{ fontSize: '32px', flexShrink: 0 }}>{a.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: 'var(--glow-gold)', fontWeight: 500, marginBottom: '3px' }}>{a.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.desc}</div>
                        {a.unlocked_at && (
                          <div style={{ fontSize: '10px', color: 'rgba(255,214,110,0.35)', marginTop: '4px' }}>
                            {new Date(a.unlocked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '18px', flexShrink: 0, opacity: 0.6 }}>✓</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked */}
            {locked.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Locked
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locked.map((a, i) => (
                    <motion.div key={a.key} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 14px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                        borderRadius: '14px', opacity: 0.55
                      }}>
                      <div style={{ fontSize: '32px', flexShrink: 0, filter: 'grayscale(1) opacity(0.4)' }}>{a.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-mid)', fontWeight: 500, marginBottom: '3px' }}>{a.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.desc}</div>
                        {a.streak > 0 && (
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Requires {a.streak}-day streak
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '16px', flexShrink: 0, opacity: 0.3 }}>🔒</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {achievements.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                <div style={{ fontSize: '40px', marginBottom: '14px' }}>🏆</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: 'var(--text-mid)', marginBottom: '8px' }}>Begin your journey.</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Check in daily to unlock achievements.</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
