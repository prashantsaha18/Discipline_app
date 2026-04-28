import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const MEDALS = {
  1: { icon: '🥇', color: '#ffd66e', glow: 'rgba(255,214,110,0.25)', bg: 'rgba(255,214,110,0.08)', border: 'rgba(255,214,110,0.3)' },
  2: { icon: '🥈', color: '#c0c8d0', glow: 'rgba(192,200,208,0.2)', bg: 'rgba(192,200,208,0.06)', border: 'rgba(192,200,208,0.25)' },
  3: { icon: '🥉', color: '#cd7f32', glow: 'rgba(205,127,50,0.2)', bg: 'rgba(205,127,50,0.06)', border: 'rgba(205,127,50,0.25)' },
}

function RankBadge({ rank }) {
  if (rank <= 3) {
    return <span style={{ fontSize: '22px' }}>{MEDALS[rank].icon}</span>
  }
  return (
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Cormorant Garamond, serif'
    }}>
      {rank}
    </div>
  )
}

function LeaderRow({ entry, index, isYou }) {
  const { rank, display_name, current_streak, longest_streak } = entry
  const medal = MEDALS[rank]
  const delay = index * 0.05

  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: rank <= 3 ? '18px 16px' : '14px 16px',
        background: isYou ? 'rgba(0,232,122,0.06)' : medal ? medal.bg : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isYou ? 'rgba(0,232,122,0.25)' : medal ? medal.border : 'var(--border)'}`,
        borderRadius: '14px',
        boxShadow: medal ? `0 0 20px ${medal.glow}` : 'none',
        position: 'relative', overflow: 'hidden'
      }}>
      {/* Shine for top 3 */}
      {medal && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: `linear-gradient(90deg, transparent, ${medal.color}40, transparent)`
        }} />
      )}

      <RankBadge rank={rank} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '14px', fontWeight: 500,
            color: medal ? medal.color : isYou ? 'var(--glow-green)' : 'var(--text-bright)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {display_name}
          </span>
          {isYou && (
            <span style={{ fontSize: '10px', color: 'var(--glow-green)', letterSpacing: '0.08em', background: 'rgba(0,232,122,0.1)', padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>
              YOU
            </span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Best: {longest_streak} days
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 300, lineHeight: 1,
          color: medal ? medal.color : isYou ? 'var(--glow-green)' : 'var(--text-mid)',
          textShadow: medal ? `0 0 20px ${medal.glow}` : 'none'
        }}>
          {current_streak}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>🔥 days</div>
      </div>
    </motion.div>
  )
}

export default function LeaderboardPage() {
  const [data, setData] = useState({ board: [], your_rank: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/leaderboard').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const topThree = data.board.filter(e => e.rank <= 3)
  const rest = data.board.filter(e => e.rank > 3)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px 20px 40px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Streak Board
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: 'var(--text-bright)', fontWeight: 300 }}>
            Warriors in discipline.
          </div>
          {data.your_rank && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ marginTop: '12px', display: 'inline-block', padding: '8px 20px',
                background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.2)',
                borderRadius: '20px' }}>
              <span style={{ fontSize: '13px', color: 'var(--glow-green)' }}>
                You are <strong>#{data.your_rank}</strong> — keep going 🔥
              </span>
            </motion.div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ color: 'var(--text-muted)', fontFamily: 'Cormorant Garamond, serif', fontSize: '18px' }}>
              Loading...
            </motion.div>
          </div>
        ) : data.board.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏆</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: 'var(--text-mid)', marginBottom: '8px' }}>
              The board is empty.
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Start your streak today and claim your place.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Top 3 podium */}
            {topThree.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '4px' }}>
                  Podium
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topThree.map((e, i) => (
                    <LeaderRow key={e.display_name + i} entry={e} index={i} isYou={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <div>
                {topThree.length > 0 && (
                  <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '4px', marginTop: '8px' }}>
                    Rankings
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rest.map((e, i) => (
                    <LeaderRow key={e.display_name + i} entry={e} index={topThree.length + i} isYou={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Privacy note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginTop: '28px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            🔒 No usernames are shown without consent. This is a space of mutual respect — not competition.
          </div>
        </motion.div>
      </div>
    </div>
  )
}
