import { useEffect, useRef, useState } from 'react'
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
  const yesRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (armed) yesRef.current?.focus()
  }, [armed])

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      setArmed(false)
    }
  }

  if (disabled) {
    return (
      <button type="button" className={BTN_DISABLED} disabled title={title} aria-label={ariaLabel}>
        {label}
      </button>
    )
  }

  if (!armed) {
    return (
      <button
        type="button"
        className={BTN_DANGER}
        title={title}
        aria-label={ariaLabel}
        disabled={busy}
        onClick={() => setArmed(true)}
      >
        {busy ? 'Working…' : label}
      </button>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" onKeyDown={onKeyDown}>
      <span className="text-[11px] text-bone-dim">{question}</span>
      <button
        ref={yesRef}
        type="button"
        className={BTN_DANGER}
        aria-label={ariaLabel ? `Confirm: ${ariaLabel}` : undefined}
        onClick={() => {
          setArmed(false)
          onConfirm()
        }}
      >
        yes
      </button>
      <button type="button" className={BTN_QUIET} onClick={() => setArmed(false)}>
        cancel
      </button>
    </span>
  )
}
