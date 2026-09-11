import Lenis from 'lenis'
import { useEffect, useRef } from 'react'

/**
 * Installs Lenis momentum scrolling for the lifetime of the mounting page.
 * Disabled outright under `prefers-reduced-motion` so the browser's own
 * instant scrolling is left alone.
 */
export function useSmoothScroll(enabled: boolean) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch devices keep native inertia; emulating it there feels laggy.
      syncTouch: false,
    })
    lenisRef.current = lenis

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [enabled])

  return lenisRef
}
