import { motion, useScroll, useTransform } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { EASE_IN_OUT, EASE_OUT_CUBIC } from '../../lib/motion'

/**
 * The opening viewport. Deliberately empty: the 3D solid behind the page is
 * the whole image, so this contributes only grain, a soft grounding gradient
 * and a scroll cue that retires the moment the page starts moving.
 *
 * Pointer events are off throughout so the canvas underneath stays draggable.
 */
export default function Hero() {
  const reducedMotion = usePrefersReducedMotion()
  const { scrollY } = useScroll()

  // The cue is gone well before the first section arrives.
  const cueOpacity = useTransform(scrollY, [0, 180], [1, 0])
  const cueShift = useTransform(scrollY, [0, 180], [0, reducedMotion ? 0 : 28])

  return (
    <section
      id="top"
      aria-label="Opening"
      className="pointer-events-none relative min-h-dvh w-full overflow-hidden"
    >
      {/* Film grain so the flat black reads as a surface rather than a void. */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Grounds the canvas into the page instead of cutting it off. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink md:h-56"
      />

      <motion.div
        aria-hidden="true"
        style={{ opacity: cueOpacity, y: cueShift }}
        className="absolute inset-x-0 bottom-9 flex flex-col items-center gap-4 md:bottom-14"
      >
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9, ease: EASE_OUT_CUBIC }}
        >
          <span className="text-[10px] tracking-[0.42em] text-bone-faint uppercase">Scroll</span>

          <div className="relative h-14 w-px overflow-hidden bg-ink-line">
            {reducedMotion ? (
              <span className="absolute inset-x-0 top-0 block h-4 bg-accent-dim" />
            ) : (
              <motion.span
                className="absolute inset-x-0 top-0 block h-4 bg-accent"
                initial={{ y: -18 }}
                animate={{ y: [-18, 56] }}
                transition={{ duration: 2.4, ease: EASE_IN_OUT, repeat: Infinity, repeatDelay: 0.5 }}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
