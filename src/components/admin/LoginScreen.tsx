import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useAuthStore } from '../../store/useAuthStore'
import { BTN_PRIMARY, DANGER_TEXT, FIELD, HINT, TRANSITION } from './adminUi'

/**
 * The gate in front of /admin. Password only — the username is fixed in
 * src/lib/adminCredentials.ts and never typed. A wrong password shakes the
 * card once (unless the visitor asked for reduced motion) and flashes the
 * field border; the password itself is never echoed anywhere.
 */
export default function LoginScreen() {
  const signIn = useAuthStore((state) => state.signIn)
  const reducedMotion = usePrefersReducedMotion()

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const cardRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (attempt === 0 || reducedMotion) return
    cardRef.current?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-9px)' },
        { transform: 'translateX(9px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 420, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
    )
  }, [attempt, reducedMotion])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (signIn(password)) return
    setError('That password does not match. Try again.')
    setAttempt((n) => n + 1)
    setPassword('')
    inputRef.current?.focus()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div
        ref={cardRef}
        className={`w-full max-w-sm rounded-lg border bg-ink-raised p-7 ${TRANSITION} ${
          error ? 'border-[#5a2424]' : 'border-ink-line'
        }`}
      >
        <h1 className="text-[12px] font-medium tracking-[0.3em] text-bone-dim uppercase">
          Restricted
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-bone-dim">
          Enter the password to open the portfolio editor.
        </p>

        <form onSubmit={onSubmit} className="mt-6" noValidate>
          <label htmlFor="admin-password" className="sr-only">
            Password
          </label>
          <input
            ref={inputRef}
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              if (error) setError(null)
            }}
            aria-invalid={error !== null}
            aria-describedby={error ? 'admin-password-error' : 'admin-password-note'}
            placeholder="Password"
            className={FIELD}
          />

          {error && (
            <p
              id="admin-password-error"
              role="alert"
              className={`${DANGER_TEXT} mt-3 text-[12px]`}
            >
              {error}
            </p>
          )}

          <button type="submit" className={`${BTN_PRIMARY} mt-5 w-full py-2`}>
            Unlock
          </button>
        </form>

        <p id="admin-password-note" className={`${HINT} mt-6 border-t border-ink-line pt-4`}>
          This gate is client-side only. It keeps the editor out of the way — it does not secure
          anything, and the session clears when the tab closes.
        </p>
      </div>
    </main>
  )
}
