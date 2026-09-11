import type { Transition } from 'framer-motion'

/** Ease-out cubic — the single easing curve used across the site. */
export const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1] as const

/** Ease-in-out for symmetric motion (modal scale, cursor grow). */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

export const TRANSITION_FAST: Transition = { duration: 0.4, ease: EASE_OUT_CUBIC }
export const TRANSITION_BASE: Transition = { duration: 0.55, ease: EASE_OUT_CUBIC }
export const TRANSITION_SLOW: Transition = { duration: 0.7, ease: EASE_OUT_CUBIC }

/** Viewport config shared by scroll-reveal animations. */
export const REVEAL_VIEWPORT = { once: true, amount: 0.25 } as const
