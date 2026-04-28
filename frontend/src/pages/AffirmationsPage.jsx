import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function AffirmationsPage() {
  const [affirmations, setAffirmations] = useState([])
  const [newText, setNewText] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [current, setCurrent] = useState(0)

  const fetchAll = () => axios.get('/api/affirmations').then(r => setAffirmations(r.data)).catch(() => {})

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (affirmations.length <= 1) return
    const t = setInterval(() => setCurrent(c => (c + 1) % affirmations.length), 5000)
    return () => clearInterval(t)
  }, [affirmations.length])

  const handleAdd = async () => {
    if (!newText.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/affirmations', { text: newText, show_in_urge: true })
      setNewText('')
      setShowForm(false)
      fetchAll()
    } catch (e) {}
    setSaving(false)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/affirmations/${id}`)
      setAffirmations(p => p.filter(a => a.id !== id))
      if (current >= affirmations.length - 1) setCurrent(0)
    } catch (e) {}
  }

  const active = affirmations[current]

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 20px 40px' }}>
      <div style={{ maxWidth:'400px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
          <div>
            <div style={{ fontSize:'10px', letterSpacing:'.2em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'6px' }}>Inner Voice</div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'26px', color:'var(--text-bright)', fontWeight:300 }}>Affirmations</div>
          </div>
          <button onClick={() => setShowForm(p => !p)} style={{
            padding:'9px 15px', background:'rgba(0,232,122,0.08)', border:'1px solid rgba(0,232,122,0.25)',
            borderRadius:'11px', color:'var(--glow-green)', fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif'
          }}>{showForm ? '✕' : '+ Add'}</button>
        </div>

        {/* Hero affirmation carousel */}
        {active && (
          <div style={{ marginBottom:'20px', position:'relative', minHeight:'160px' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse, rgba(0,232,122,0.06) 0%, transparent 70%)', borderRadius:'20px', pointerEvents:'none' }} />
            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                style={{ padding:'32px 24px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(0,232,122,0.15)', borderRadius:'20px', textAlign:'center' }}>
                <motion.div animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:4, repeat:Infinity }}
                  style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'22px', color:'var(--text-bright)', lineHeight:1.7, fontStyle:'italic', marginBottom:'16px' }}>
                  "{active.text}"
                </motion.div>
                {affirmations.length > 1 && (
                  <div style={{ display:'flex', gap:'6px', justifyContent:'center' }}>
                    {affirmations.map((_,i) => (
                      <button key={i} onClick={() => setCurrent(i)} style={{
                        width:'6px', height:'6px', borderRadius:'50%', border:'none', cursor:'pointer',
                        background: i===current ? 'var(--glow-green)' : 'rgba(255,255,255,0.15)',
                        transition:'all .3s', boxShadow: i===current ? '0 0 6px var(--glow-green)' : 'none'
                      }} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
              style={{ overflow:'hidden', marginBottom:'16px' }}>
              <div style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'16px' }}>
                <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'10px' }}>New Affirmation</div>
                <textarea value={newText} onChange={e => setNewText(e.target.value)}
                  placeholder="I am stronger than my urges..."
                  style={{ width:'100%', padding:'13px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'11px', color:'var(--text-bright)', fontSize:'14px', resize:'none', height:'80px', outline:'none', fontFamily:'Cormorant Garamond, serif', caretColor:'var(--glow-green)', marginBottom:'10px' }}
                />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'10px', color:newText.length > 180 ? 'rgba(255,100,100,0.7)' : 'var(--text-muted)' }}>{200 - newText.length} left</span>
                  <button onClick={handleAdd} disabled={saving || !newText.trim()} style={{
                    padding:'10px 18px', background:'rgba(0,232,122,0.1)', border:'1px solid rgba(0,232,122,0.28)', borderRadius:'10px',
                    color:'var(--glow-green)', fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', opacity: newText.trim() ? 1 : 0.4
                  }}>{saving ? '...' : 'Save'}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'4px' }}>
            All Affirmations ({affirmations.length})
          </div>
          {affirmations.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.04 }}
              style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px', background: i===current ? 'rgba(0,232,122,0.06)' : 'rgba(255,255,255,0.02)', border:`1px solid ${i===current ? 'rgba(0,232,122,0.2)' : 'var(--border)'}`, borderRadius:'13px', cursor:'pointer', transition:'all .2s' }}
              onClick={() => setCurrent(i)}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', color: i===current ? 'var(--text-bright)' : 'var(--text-mid)', lineHeight:1.5 }}>{a.text}</div>
                {a.show_in_urge && <div style={{ fontSize:'9px', color:'rgba(0,232,122,0.4)', marginTop:'4px', letterSpacing:'.1em' }}>SHOWS IN URGE MODE</div>}
              </div>
              <button onClick={e => { e.stopPropagation(); handleDelete(a.id) }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,80,80,0.25)', fontSize:'14px', flexShrink:0, padding:'4px' }}>✕</button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
