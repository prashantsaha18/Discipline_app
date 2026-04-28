import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div style={{ height: '100dvh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: 'var(--glow-gold)', letterSpacing: '0.15em' }}
      >
        BRAHMACHARYA
      </motion.div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--glow-green)' }} />
        ))}
      </div>
    </div>
  )
}
