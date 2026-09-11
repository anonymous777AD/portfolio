/**
 * Shared class strings for the admin tool.
 *
 * The panel deliberately breaks from the site's cinematic styling: it is dense,
 * sans-only and flat. Same palette (ink / bone / accent) and the same easing
 * curve, none of the 3D, parallax or reveal motion. Nothing here sets
 * `outline-none` — the global `:focus-visible` ring must stay visible on every
 * control.
 */

/**
 * The site's single easing curve, at the fast end of its 400-700ms band: the
 * panel is dense and gets hovered constantly, but nothing here is allowed to
 * snap either. `motion-reduce:transition-none` is what honours the reduced
 * motion preference for every control at once — the two motions that JS owns
 * (the login shake, the drag-reorder tween) gate on the hook instead.
 */
export const TRANSITION =
  'transition-colors duration-[400ms] ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none'

export const PANEL = 'rounded-lg border border-ink-line bg-ink-raised/40'

// `aria-disabled` is styled alongside `disabled` because the confirm control
// keeps locked buttons focusable (a `disabled` button cannot be reached by
// keyboard, so its `title` explaining the lock would be unreachable too).
const BTN_BASE =
  `inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-[12px] leading-none font-medium whitespace-nowrap ${TRANSITION} disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45`

/** Neutral action. */
export const BTN = `${BTN_BASE} border-ink-line bg-ink text-bone-dim hover:bg-ink-raised hover:text-bone`

/** The single accented affordance in a given region. */
export const BTN_PRIMARY = `${BTN_BASE} border-accent/55 bg-accent/10 text-accent hover:bg-accent/20`

/** Destructive action. */
export const BTN_DANGER = `${BTN_BASE} border-[#4b2020] bg-[#180e0e] text-[#ff8f8f] hover:bg-[#241414]`

/** Text-only action for cancels and tertiary controls. */
export const BTN_QUIET = `${BTN_BASE} border-transparent bg-transparent text-bone-faint hover:text-bone`

/** Non-interactive button look, used for controls that are intentionally locked. */
export const BTN_DISABLED = `${BTN_BASE} cursor-not-allowed border-ink-line bg-ink text-bone-faint/60`

export const FIELD = `w-full rounded-md border border-ink-line bg-ink px-2.5 py-1.5 text-[13px] text-bone placeholder:text-bone-faint ${TRANSITION} hover:border-bone-faint/40 focus:border-accent/70`

export const SELECT = `${FIELD} cursor-pointer pr-6`

export const LABEL = 'block text-[11px] font-medium tracking-[0.16em] text-bone-faint uppercase'

export const HINT = 'text-[11px] leading-relaxed text-bone-faint'

/** The one red used for error copy, so the four call sites cannot drift. */
export const DANGER_TEXT = 'text-[#ff8f8f]'

/** Error banner surface — border + ground to sit DANGER_TEXT on. */
export const DANGER_PANEL = 'rounded-lg border border-[#4b2020] bg-[#180e0e]'

export const SECTION_TITLE = 'text-[12px] font-medium tracking-[0.2em] text-bone uppercase'
