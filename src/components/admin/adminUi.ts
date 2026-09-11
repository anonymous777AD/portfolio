/**
 * Shared class strings for the admin tool.
 *
 * The panel deliberately breaks from the site's cinematic styling: it is dense,
 * sans-only and static. Same palette (ink / bone / accent), none of the motion.
 * Nothing here sets `outline-none` — the global `:focus-visible` ring must stay
 * visible on every control.
 */

export const PANEL = 'rounded-lg border border-ink-line bg-ink-raised/40'

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-[12px] leading-none font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45'

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

export const FIELD =
  'w-full rounded-md border border-ink-line bg-ink px-2.5 py-1.5 text-[13px] text-bone placeholder:text-bone-faint hover:border-bone-faint/40 focus:border-accent/70'

export const SELECT = `${FIELD} cursor-pointer pr-6`

export const LABEL = 'block text-[11px] font-medium tracking-[0.16em] text-bone-faint uppercase'

export const HINT = 'text-[11px] leading-relaxed text-bone-faint'

export const DANGER_TEXT = 'text-[#ff8f8f]'

export const SECTION_TITLE = 'text-[12px] font-medium tracking-[0.2em] text-bone uppercase'
