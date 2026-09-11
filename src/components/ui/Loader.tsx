import { motion } from 'framer-motion'
import { EASE_OUT_CUBIC } from '../../lib/motion'

/**
 * The boot screen shown while `/projects.json` is in flight — a wireframe
 * echo of the hero solid, drawn in CSS so it paints before the 3D chunk
 * has even been requested.
 */
export default function Loader({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-8">
        <motion.svg
          width="76"
          height="76"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 5.5, ease: 'linear', repeat: Infinity }}
        >
          <motion.circle
            cx="50"
            cy="50"
            r="32"
            stroke="var(--color-accent)"
            strokeWidth="1"
            strokeDasharray="6 10"
            opacity="0.85"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="32"
            stroke="var(--color-bone)"
            strokeWidth="1"
            strokeDasharray="4 14"
            opacity="0.35"
            style={{ transformOrigin: '50% 50%', rotate: 38 }}
          />
          <motion.rect
            x="30"
            y="30"
            width="40"
            height="40"
            stroke="var(--color-bone)"
            strokeWidth="1"
            opacity="0.5"
            style={{ transformOrigin: '50% 50%' }}
            animate={{ rotate: [0, 90] }}
            transition={{ duration: 2.75, ease: EASE_OUT_CUBIC, repeat: Infinity }}
          />
        </motion.svg>
        <span className="text-[11px] tracking-[0.4em] text-bone-faint uppercase">{label}</span>
      </div>
    </div>
  )
}
