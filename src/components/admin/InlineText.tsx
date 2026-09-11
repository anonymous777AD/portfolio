import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

interface InlineTextProps {
  value: string
  /** Called with the trimmed value on blur / Enter, only when it actually changed. */
  onCommit: (next: string) => void
  ariaLabel: string
  placeholder?: string
  /** Tooltip — used for the long Cloudinary URLs, which render truncated. */
  title?: string
  className?: string
  spellCheck?: boolean
}

/**
 * A text cell that is always an input but reads as text until hovered or
 * focused. Commits on blur or Enter, reverts on Escape, and refuses to commit
 * an empty value (so a stray select-all + delete can't wipe a field).
 */
export default function InlineText({
  value,
  onCommit,
  ariaLabel,
  placeholder,
  title,
  className = '',
  spellCheck = false,
}: InlineTextProps) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  const cancelledRef = useRef(false)

  // The store is the source of truth: whenever it changes underneath us (a
  // commit, an import, a revert) the draft follows it. Adjusting during render
  // rather than in an effect keeps the field from flashing the stale text.
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur() // blur does the commit — one code path
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      cancelledRef.current = true
      event.currentTarget.blur()
    }
  }

  const onBlur = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false
      setDraft(value)
      return
    }
    const next = draft.trim()
    if (!next) {
      setDraft(value)
      return
    }
    if (next !== value) onCommit(next)
    else setDraft(next)
  }

  return (
    <input
      type="text"
      value={draft}
      aria-label={ariaLabel}
      placeholder={placeholder}
      title={title}
      spellCheck={spellCheck}
      autoComplete="off"
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className={`w-full rounded-[3px] border border-transparent bg-transparent px-1.5 py-1 text-[13px] text-bone transition-colors duration-150 hover:border-ink-line hover:bg-ink focus:border-accent/60 focus:bg-ink ${className}`}
    />
  )
}
