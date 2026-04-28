import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const CATEGORIES = ['all','discipline','mind','strength','brahmacharya','resilience','focus']
const CAT_COLORS = {
  all:'var(--glow-green)', discipline:'#00e87a', mind:'rgba(180,100,255,0.9)',
  strength:'rgba(255,140,80,0.9)', brahmacharya:'var(--glow-gold)',
  resilience:'rgba(100,180,255,0.9)', focus:'rgba(255,100,100,0.9)'
}

export default function QuotesPage() {
  const [daily, setDaily] = useState(null)
  const [current, setCurrent] = useState(null)
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState([])
  const [view, setView] = useState('daily') // daily | explore | saved

  useEffect(() => {
    axios.get('/api/quotes/daily').then(r => { setDaily(r.data); setCurrent(r.data) }).catch(() => {})
    const s = localStorage.getItem('bSavedQuotes')
    if (s) setSaved(JSON.parse(s))
  }, [])

  const fetchRandom = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`/api/quotes/random?category=${category}`)
      setCurrent(data)
    } catch (e) {}
    setLoading(false)
  }, [category])

  const toggleSave = (q) => {
    const key = q.text
    const alreadySaved = saved.some(s => s.text === key)
    const next = alreadySaved ? saved.filter(s => s.text !== key) : [...saved, q]
    setSaved(next)
    localStorage.setItem('bSavedQuotes', JSON.stringify(next))
  }

  const isSaved = (q) => q && saved.some(s => s.text === q.text)

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 20px 40px' }}>
      <div style={{ maxWidth:'400px', margin:'0 auto' }}>
        <div style={{ marginBottom:'22px' }}>
          <div style={{ fontSize:'10px', letterSpacing:'.2em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'6px' }}>Wisdom</div>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'26px', color:'var(--text-bright)', fontWeight:300 }}>Daily Quotes</div>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.03)', borderRadius:'11px', padding:'3px', marginBottom:'22px' }}>
          {[['daily','Today'],['explore','Explore'],['saved','Saved']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              flex:1, padding:'8px', border:'none', borderRadius:'9px', cursor:'pointer',
              background: view===v ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: view===v ? 'var(--text-bright)' : 'var(--text-muted)',
              fontSize:'12px', transition:'all .2s', fontFamily:'DM Sans, sans-serif'
            }}>{l}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* DAILY */}
          {view === 'daily' && daily && (
            <motion.div key="daily" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div style={{ position:'relative', padding:'32px 24px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'20px', marginBottom:'16px' }}>
                <div style={{ position:'absolute', top:'16px', left:'50%', transform:'translateX(-50%)', fontSize:'10px', letterSpacing:'.2em', color:'rgba(255,214,110,0.4)', textTransform:'uppercase' }}>
                  Today's Wisdom
                </div>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,214,110,0.3),transparent)' }} />
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'22px', color:'var(--text-bright)', lineHeight:1.65, textAlign:'center', fontStyle:'italic', marginTop:'14px' }}>
                  "{daily.text}"
                </div>
                <div style={{ textAlign:'center', marginTop:'16px', fontSize:'12px', color:'var(--text-muted)' }}>
                  — {daily.author}
                </div>
                <div style={{ textAlign:'center', marginTop:'8px' }}>
                  <span style={{ fontSize:'10px', padding:'3px 10px', background:`${CAT_COLORS[daily.category]}15`, border:`1px solid ${CAT_COLORS[daily.category]}30`, borderRadius:'10px', color:CAT_COLORS[daily.category], letterSpacing:'.08em', textTransform:'capitalize' }}>
                    {daily.category}
                  </span>
                </div>
              </div>
              <button onClick={() => toggleSave(daily)} style={{
                width:'100%', padding:'13px', background: isSaved(daily) ? 'rgba(255,214,110,0.08)' : 'rgba(255,255,255,0.02)',
                border:`1px solid ${isSaved(daily) ? 'rgba(255,214,110,0.3)' : 'var(--border)'}`,
                borderRadius:'13px', color: isSaved(daily) ? 'var(--glow-gold)' : 'var(--text-muted)',
                fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', letterSpacing:'.08em'
              }}>
                {isSaved(daily) ? '★ Saved' : '☆ Save Quote'}
              </button>
            </motion.div>
          )}

          {/* EXPLORE */}
          {view === 'explore' && (
            <motion.div key="explore" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              {/* Category filter */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', marginBottom:'18px' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    style={{
                      padding:'7px 13px', border:`1px solid ${category===c ? CAT_COLORS[c] : 'var(--border)'}`,
                      background: category===c ? `${CAT_COLORS[c]}15` : 'transparent',
                      borderRadius:'20px', color: category===c ? CAT_COLORS[c] : 'var(--text-muted)',
                      fontSize:'11px', cursor:'pointer', textTransform:'capitalize', fontFamily:'DM Sans, sans-serif',
                      transition:'all .2s'
                    }}>{c}</button>
                ))}
              </div>

              {/* Quote card */}
              <AnimatePresence mode="wait">
                {current && (
                  <motion.div key={current.text} initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.97 }}
                    style={{ padding:'28px 22px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'18px', marginBottom:'14px' }}>
                    <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'20px', color:'var(--text-bright)', lineHeight:1.7, fontStyle:'italic', marginBottom:'16px' }}>
                      "{current.text}"
                    </div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>— {current.author}</div>
                    <div style={{ marginTop:'10px' }}>
                      <span style={{ fontSize:'10px', padding:'3px 10px', background:`${CAT_COLORS[current.category]}15`, border:`1px solid ${CAT_COLORS[current.category]}30`, borderRadius:'10px', color:CAT_COLORS[current.category], textTransform:'capitalize' }}>
                        {current.category}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display:'flex', gap:'10px' }}>
                <motion.button whileTap={{ scale:0.97 }} onClick={fetchRandom} disabled={loading}
                  style={{ flex:1, padding:'14px', background:'rgba(0,232,122,0.08)', border:'1px solid rgba(0,232,122,0.25)', borderRadius:'13px', color:'var(--glow-green)', fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', letterSpacing:'.1em', textTransform:'uppercase' }}>
                  {loading ? '...' : '↻ New Quote'}
                </motion.button>
                {current && (
                  <button onClick={() => toggleSave(current)} style={{
                    padding:'14px 18px', background: isSaved(current) ? 'rgba(255,214,110,0.08)' : 'rgba(255,255,255,0.02)',
                    border:`1px solid ${isSaved(current) ? 'rgba(255,214,110,0.3)' : 'var(--border)'}`,
                    borderRadius:'13px', color: isSaved(current) ? 'var(--glow-gold)' : 'var(--text-muted)',
                    fontSize:'18px', cursor:'pointer'
                  }}>{isSaved(current) ? '★' : '☆'}</button>
                )}
              </div>
            </motion.div>
          )}

          {/* SAVED */}
          {view === 'saved' && (
            <motion.div key="saved" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              {saved.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px' }}>
                  <div style={{ fontSize:'36px', marginBottom:'12px' }}>☆</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'18px', color:'var(--text-mid)' }}>No saved quotes yet.</div>
                  <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'6px' }}>Star quotes in the Explore tab.</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {saved.map((q, i) => (
                    <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}
                      style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'14px' }}>
                      <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'15px', color:'var(--text-bright)', lineHeight:1.65, fontStyle:'italic', marginBottom:'10px' }}>
                        "{q.text}"
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>— {q.author}</div>
                        <button onClick={() => toggleSave(q)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--glow-gold)', fontSize:'16px' }}>★</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
