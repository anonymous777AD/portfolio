import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { EASE_OUT_CUBIC, REVEAL_VIEWPORT } from '../../lib/motion'
import { indexLabel } from './sectionUtils'

interface CategoryHeadingProps {
  label: string
  /** Tiny uppercase kicker above the serif line. */
  eyebrow?: string
  /** Item count, rendered as an unobtrusive 02-style tally. */
  count?: number
  className?: string
}

const WIPE_IN = { clipPath: 'inset(0% 0% 0% 0%)', x: 0, opacity: 1 }
const WIPE_OUT = { clipPath: 'inset(0% 100% 0% 0%)', x: -36, opacity: 0 }

/**
 * The big serif category line. On entry the type wipes in from the left behind
 * a clipping mask while a hairline accent rule draws out beneath it. Under
 * reduced motion the same composition renders flat, with nothing moving.
 */
export default function CategoryHeading({
  label,
  eyebrow,
  count,
  className = '',
}: CategoryHeadingProps) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className={className}>
      {(eyebrow || typeof count === 'number') && (
        <motion.div
          className="mb-5 flex items-baseline gap-4 md:mb-7"
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={REVEAL_VIEWPORT}
          transition={{ duration: 0.6, ease: EASE_OUT_CUBIC }}
        >
          {eyebrow && (
            <span className="text-[10px] tracking-[0.42em] text-bone-faint uppercase">
              {eyebrow}
            </span>
          )}
          {typeof count === 'number' && (
            <span className="text-[10px] tracking-[0.3em] text-accent-dim tabular-nums">
              {indexLabel(count - 1)}
            </span>
          )}
        </motion.div>
      )}

      <h2 className="display-type font-display text-bone">
        {/*
          The mask carries the viewport trigger and the inner line animates
          through variant propagation. The trigger cannot live on the line
          itself: its hidden state is clipped to zero width inside this
          overflow-hidden parent, so an IntersectionObserver watching it would
          never see it cross the threshold and it would stay invisible forever.
          The mask always has the line's full geometry, so it is the honest
          thing to observe.
        */}
        <motion.span
          className="block overflow-hidden pb-[0.18em]"
          initial={reducedMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
        >
          <motion.span
            className="block break-words will-change-transform"
            style={{ fontSize: 'clamp(2.5rem, 9vw, 7rem)' }}
            variants={{ hidden: WIPE_OUT, visible: WIPE_IN }}
            transition={{ duration: 0.7, ease: EASE_OUT_CUBIC }}
          >
            {label}
          </motion.span>
        </motion.span>
      </h2>

      <motion.div
        aria-hidden="true"
        className="mt-6 h-px w-full origin-left bg-gradient-to-r from-accent via-ink-line to-transparent md:mt-8"
        initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={REVEAL_VIEWPORT}
        transition={{ duration: 0.7, ease: EASE_OUT_CUBIC, delay: 0.12 }}
      />
    </div>
  )
}
