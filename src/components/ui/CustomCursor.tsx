import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

const INTERACTIVE = 'a, button, [role="button"], input, select, textarea, [data-cursor="grow"]'

/**
 * A small trailing ring that replaces the native pointer on fine-pointer
 * devices and swells over anything clickable. Position is written straight to
 * the transform each frame — no React state per mousemove.
 */
export default function CustomCursor() {
  const reducedMotion = usePrefersReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setEnabled(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!enabled) return
    document.body.classList.add('has-custom-cursor')
    return () => document.body.classList.remove('has-custom-cursor')
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const node = document.getElementById('custom-cursor')
    if (!node) return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let x = targetX
    let y = targetY
    let frame = 0

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      setVisible(true)
      const target = event.target
      setHovering(target instanceof Element ? target.closest(INTERACTIVE) !== null : false)
    }
    const onLeave = () => setVisible(false)

    const tick = () => {
      // Reduced motion gets a 1:1 pointer; otherwise it eases behind.
      const lerp = reducedMotion ? 1 : 0.22
      x += (targetX - x) * lerp
      y += (targetY - y) * lerp
      node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled, reducedMotion])

  if (!enabled) return null

  return (
    <div
      id="custom-cursor"
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[999] rounded-full border border-bone/70 mix-blend-difference"
      style={{
        width: hovering ? 46 : 18,
        height: hovering ? 46 : 18,
        opacity: visible ? (hovering ? 1 : 0.75) : 0,
        backgroundColor: hovering ? 'rgb(242 240 236 / 0.08)' : 'transparent',
        transition:
          'width 400ms cubic-bezier(0.33,1,0.68,1), height 400ms cubic-bezier(0.33,1,0.68,1), opacity 300ms ease-out, background-color 400ms ease-out',
        willChange: 'transform',
      }}
    />
  )
}
