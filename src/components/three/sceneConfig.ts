import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

/* ---------------------------------------------------------------------------
   Shared constants for the persistent 3D layer.

   This module deliberately imports nothing from `three` / `@react-three/*` so
   it can be pulled into the main bundle while the actual WebGL work stays in a
   lazily-loaded chunk. The DOM layer needs these numbers to know how much of
   the viewport the shape covers, which is what lets the pinned size land on an
   exact pixel target instead of being eyeballed.
--------------------------------------------------------------------------- */

export const CAMERA_FOV = 35
export const CAMERA_DISTANCE = 13

/**
 * Half-height of the knot in world units: the (2,3) torus-knot curve peaks at
 * 1.5x its `radius`, plus the 0.32 tube, plus a little headroom for the
 * vertex distortion.
 */
export const KNOT_WORLD_RADIUS = 2

/** Fraction of the viewport height the shape covers while the canvas is full-bleed. */
export const HERO_KNOT_FRACTION =
  (2 * KNOT_WORLD_RADIUS) / (2 * CAMERA_DISTANCE * Math.tan((CAMERA_FOV * Math.PI) / 360))

/**
 * The simplified (small screen / low core count) scene renders the shape
 * smaller so it still clears the edges of a narrow portrait viewport.
 */
export const SIMPLIFIED_SCALE = 0.72

export interface PinTarget {
  /** On-screen height of the shape once it is pinned, in CSS pixels. */
  size: number
  /** Gap kept between the pinned shape and the viewport edges, in CSS pixels. */
  inset: number
}

export const PIN_FULL: PinTarget = { size: 172, inset: 40 }
export const PIN_COMPACT: PinTarget = { size: 118, inset: 20 }

/**
 * Bounds on the pinned CSS scale. They stop an extreme viewport (a very short
 * landscape phone, a zoomed desktop) from inverting or all but erasing the
 * shape. When a bound bites, the pinned shape is no longer `PIN_*.size` tall,
 * which is why the translation maths re-derives the on-screen size from the
 * clamped scale rather than assuming the target.
 */
export const PIN_SCALE_MIN = 0.12
export const PIN_SCALE_MAX = 0.65

/* ---------------------------------------------------------------------------
   Environment probes
--------------------------------------------------------------------------- */

/**
 * Cheap one-shot WebGL probe. The throwaway context is released immediately so
 * it never counts against the browser's per-page context budget.
 */
export function hasWebGLSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  try {
    const probe = document.createElement('canvas')
    const gl = (probe.getContext('webgl2') ?? probe.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    const lose = gl.getExtension('WEBGL_lose_context')
    if (lose) lose.loseContext()
    return true
  } catch {
    return false
  }
}

/** Small screens and thin CPUs get the cheaper geometry, dpr and environment. */
export function useSimplifiedScene(): boolean {
  const small = useMediaQuery('(max-width: 768px)')
  const [lowPower] = useState(
    () => typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4,
  )
  return small || lowPower
}

/** False while the tab is in the background, so the render loop can be stopped. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return visible
}

/** Belt-and-braces guard: stop rendering if the host element leaves the viewport. */
export function useOnScreen(ref: RefObject<Element | null>): boolean {
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (entry) setOnScreen(entry.isIntersecting)
      },
      { threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])

  return onScreen
}
