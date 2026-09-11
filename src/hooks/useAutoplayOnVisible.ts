import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Fraction of the element that must be on screen before playback starts. */
  threshold?: number
  /** Set false to force-pause (e.g. while the lightbox is open). */
  enabled?: boolean
}

/**
 * Drives a <video> from an IntersectionObserver: plays once at least
 * `threshold` of it is on screen, pauses the moment it leaves. Playback is
 * also suspended while the tab is hidden so backgrounded tabs stop pulling
 * bytes from the CDN.
 *
 * Returns the ref to attach plus whether the element is currently considered
 * visible, which callers use to drive ken-burns / reveal styling.
 */
export function useAutoplayOnVisible({ threshold = 0.5, enabled = true }: Options = {}) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= threshold),
      // Two thresholds so we get a callback on the way in *and* on the way out.
      { threshold: [0, threshold] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const shouldPlay = () => visible && enabled && !document.hidden

    const sync = () => {
      if (shouldPlay()) {
        // Autoplay can still be refused (low power mode, no user gesture);
        // swallowing keeps it from surfacing as an unhandled rejection.
        const attempt = el.play()
        if (attempt) attempt.catch(() => undefined)
      } else if (!el.paused) {
        el.pause()
      }
    }

    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [visible, enabled])

  // Free the decoded buffer for anything scrolled well out of the way.
  useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    if (el.currentTime > 0 && el.readyState > 2) el.pause()
  }, [visible])

  return { ref, visible }
}
