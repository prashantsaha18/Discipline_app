import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`
)

const MOOD_EMOJIS = { peaceful:'🌿', focused:'🎯', anxious:'⚡', bored:'🌑', stressed:'🔥', tired:'🌙', angry:'💢', grateful:'🙏' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '15px', color: 'var(--glow-green)', fontFamily: 'Cormorant Garamond, serif' }}>{payload[0]?.value}</div>
    </div>
  )
}

function Card({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '15px', marginBottom: '10px' }}>
      {children}
    </motion.div>
  )
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>{children}</div>
}

export default function InsightsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/insights').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: 'var(--text-muted)' }}>
        Reading patterns...
      </motion.div>
    </div>
  )

  const hourData = (data?.urge_by_hour || []).map(r => ({
    hour: HOUR_LABELS[+r.hour] || `${r.hour}h`, count: +r.count
  }))
  const maxHourCount = Math.max(...hourData.map(d => d.count), 1)

  const triggerData = (data?.top_triggers || []).map(r => ({
    name: (r.trigger_type || 'unknown').replace('_', ' '), value: +r.count
  }))
  const maxTrigger = Math.max(...triggerData.map(d => d.value), 1)

  const moodData = (data?.mood_frequency || []).map(r => ({ mood: r.mood, count: +r.count }))
  const maxMood = Math.max(...moodData.map(d => d.count), 1)

  const us = data?.urge_stats
  const surviveRate = us && +us.total_urges > 0
    ? Math.round((+us.survived / +us.total_urges) * 100) : null

  const hasData = hourData.length > 0 || triggerData.length > 0 || moodData.length > 0

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 20px 40px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Your patterns</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', color: 'var(--text-bright)', fontWeight: 300 }}>Know yourself deeply.</div>
        </div>

        {/* Key insight */}
        {data?.insight && (
          <Card delay={0.04}>
            <SectionTitle>◉ Key Insight</SectionTitle>
            <p style={{ fontSize: '15px', color: 'var(--text-bright)', lineHeight: 1.65, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', margin: 0 }}>
              {data.insight}
            </p>
          </Card>
        )}

        {/* Urge survival stats */}
        {us && +us.total_urges > 0 && (
          <Card delay={0.08}>
            <SectionTitle>Urge Statistics</SectionTitle>
            <div style={{ display: 'flex', gap: '0', overflow: 'hidden', borderRadius: '10px', border: '1px solid var(--border)' }}>
              {[
                { val: us.total_urges, lbl: 'Total', color: 'var(--text-mid)' },
                { val: us.survived, lbl: 'Survived', color: 'var(--glow-green)' },
                { val: surviveRate != null ? `${surviveRate}%` : '—', lbl: 'Win Rate', color: 'var(--glow-gold)' },
              ].map(({ val, lbl, color }, i, arr) => (
                <div key={lbl} style={{ flex: 1, padding: '14px 10px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', fontWeight: 300, color, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Urge by hour chart */}
        {hourData.length > 0 && (
          <Card delay={0.12}>
            <SectionTitle>Urge frequency · by hour</SectionTitle>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={hourData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.22)' }} interval={2} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.22)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {hourData.map((d, i) => (
                    <Cell key={i} fill={d.count === maxHourCount ? 'rgba(255,100,80,0.75)' : 'rgba(0,232,122,0.28)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>🔴 peak · 🟢 lower risk</div>
          </Card>
        )}

        {/* Top triggers */}
        {triggerData.length > 0 && (
          <Card delay={0.16}>
            <SectionTitle>Top Triggers</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {triggerData.map((t, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-bright)', textTransform: 'capitalize' }}>{t.name}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'Cormorant Garamond, serif' }}>{t.value}×</span>
                  </div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(t.value / maxTrigger) * 100}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
                      style={{ height: '100%', background: 'rgba(255,140,80,0.6)', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Mood */}
        {moodData.length > 0 && (
          <Card delay={0.2}>
            <SectionTitle>Mood Patterns</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {moodData.map((m, i) => {
                const size = 0.35 + (m.count / maxMood) * 0.65
                return (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25 + i * 0.05, type: 'spring' }}
                    style={{
                      padding: '9px 13px', background: `rgba(0,232,122,${size * 0.08})`,
                      border: `1px solid rgba(0,232,122,${size * 0.22})`,
                      borderRadius: '11px', display: 'flex', alignItems: 'center', gap: '7px'
                    }}>
                    <span style={{ fontSize: '17px' }}>{MOOD_EMOJIS[m.mood] || '○'}</span>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-bright)', textTransform: 'capitalize' }}>{m.mood}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{m.count}×</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        )}

        {!hasData && (
          <Card delay={0.1}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>◌</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: 'var(--text-mid)', marginBottom: '8px' }}>Patterns emerge with time.</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>Use the urge button and mood check daily. Your insights will appear here.</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
