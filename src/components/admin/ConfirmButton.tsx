import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { BTN_DANGER, BTN_DISABLED, BTN_QUIET } from './adminUi'

interface ConfirmButtonProps {
  /** Idle label, e.g. "Delete". */
  label: string
  /** Question shown once armed, e.g. "Delete?". */
  question?: string
  onConfirm: () => void
  /** Renders the control locked, with `title` explaining why. */
  disabled?: boolean
  title?: string
  /** Accessible name — always pass one when the label alone is ambiguous in a list. */
  ariaLabel?: string
  busy?: boolean
}

/**
 * Two-step destructive control: click once to arm, then "yes" / "cancel"
 * inline. Deliberately not window.confirm — it blocks the tab and reads as a
 * browser dialog rather than part of the row.
 */
export default function ConfirmButton({
  label,
  question = 'Delete?',
  onConfirm,
  disabled = false,
  title,
  ariaLabel,
  busy = false,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false)
  const questionId = useId()
  const yesRef = useRef<HTMLButtonElement | null>(null)
  const idleRef = useRef<HTMLButtonElement | null>(null)
  const wasArmedRef = useRef(false)

  useEffect(() => {
    if (armed) {
      wasArmedRef.current = true
      yesRef.current?.focus()
      return
    }
    // Disarming (Escape or "cancel") destroys the button that had focus. Hand it
    // back to the idle control, or a keyboard user is dumped onto <body> and has
    // to tab in from the top of the document again. On a confirm that unmounts
    // the row this effect never runs, which is the right outcome.
    if (wasArmedRef.current) {
      wasArmedRef.current = false
      idleRef.current?.focus()
    }
  }, [armed])

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      setArmed(false)
    }
  }

  if (disabled) {
    // `aria-disabled` rather than `disabled`: a truly disabled button drops out
    // of the tab order, which would leave a keyboard or screen-reader user with
    // no way to reach the `title` explaining why the control is locked. The
    // reason is folded into the accessible name for the same reason.
    return (
      <button
        type="button"
        className={BTN_DISABLED}
        aria-disabled="true"
        title={title}
        aria-label={title ? `${ariaLabel ?? label} — ${title}` : ariaLabel}
        onClick={(event) => event.preventDefault()}
      >
        {label}
      </button>
    )
  }

  if (!armed) {
    return (
      <button
        ref={idleRef}
        type="button"
        className={BTN_DANGER}
        title={title}
        aria-label={ariaLabel}
        aria-disabled={busy || undefined}
        aria-busy={busy || undefined}
        onClick={() => {
          if (busy) return
          setArmed(true)
        }}
      >
        {busy ? 'Working…' : label}
      </button>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" onKeyDown={onKeyDown}>
      <span id={questionId} className="text-[11px] text-bone-dim">
        {question}
      </span>
      <button
        ref={yesRef}
        type="button"
        className={BTN_DANGER}
        aria-label={ariaLabel ? `Confirm: ${ariaLabel}` : undefined}
        // The question carries the consequence ("3 will be uncategorised"); the
        // label alone would not, and focus lands here the moment it appears.
        aria-describedby={questionId}
        onClick={() => {
          setArmed(false)
          onConfirm()
        }}
      >
        yes
      </button>
      <button
        type="button"
        className={BTN_QUIET}
        aria-label={ariaLabel ? `Cancel: ${ariaLabel}` : undefined}
        onClick={() => setArmed(false)}
      >
        cancel
      </button>
    </span>
  )
}
