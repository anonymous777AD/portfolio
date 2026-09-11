import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import {
  HERO_KNOT_FRACTION,
  PIN_COMPACT,
  PIN_FULL,
  PIN_SCALE_MAX,
  PIN_SCALE_MIN,
  SIMPLIFIED_SCALE,
  hasWebGLSupport,
  useOnScreen,
  usePageVisible,
  useSimplifiedScene,
} from './sceneConfig'

// Keeps three/drei/fiber out of the entry chunk entirely.
const SceneCanvas = lazy(() => import('./SceneCanvas'))

/** How much of the first viewport the pin transition is spread across. */
const PIN_SPAN = 0.8
/** How faded the shape sits once it is an ambient corner element. */
const PINNED_OPACITY = 0.72

/**
 * Overdamped (damping ratio ~1.9) so it never overshoots: a step settles in
 * ~600ms, which puts the pin inside the site's 400-700ms motion band while
 * staying scroll-linked rather than time-linked.
 */
const PIN_SPRING = { stiffness: 130, damping: 30, mass: 0.5, restDelta: 0.0005 }

interface BoundaryProps {
  children: ReactNode
}

interface BoundaryState {
  failed: boolean
}

/**
 * The 3D layer is pure decoration. A lost context, a shader that will not
 * compile, a chunk that fails to download — none of it should take the page
 * with it. Sits outside the Suspense boundary so lazy-import rejections are
 * caught too.
 */
class SceneBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function Scene3D() {
  const reduced = usePrefersReducedMotion()
  const simplified = useSimplifiedScene()
  const pageVisible = usePageVisible()
  const host = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(host)
  const [supported] = useState(hasWebGLSupport)

  const target = simplified ? PIN_COMPACT : PIN_FULL
  const heroFraction = HERO_KNOT_FRACTION * (simplified ? SIMPLIFIED_SCALE : 1)

  /*
    Viewport size lives in motion values rather than React state: the pin
    transforms re-resolve on resize without ever re-rendering the tree. Seeded
    from the real viewport so a page restored mid-scroll pins correctly on the
    very first frame.
  */
  const [initialViewport] = useState(() => ({
    w: typeof window === 'undefined' ? 1440 : window.innerWidth,
    h: typeof window === 'undefined' ? 900 : window.innerHeight,
  }))
  const viewportW = useMotionValue(initialViewport.w)
  const viewportH = useMotionValue(initialViewport.h)
  useEffect(() => {
    const sync = () => {
      viewportW.set(window.innerWidth)
      viewportH.set(window.innerHeight)
    }
    sync()
    window.addEventListener('resize', sync, { passive: true })
    window.addEventListener('orientationchange', sync, { passive: true })
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [viewportW, viewportH])

  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)

  /* 0 at the top of the page, 1 once the hero has scrolled away. */
  const rawPin = useTransform<number, number>([scrollY, viewportH], ([y, h]) => {
    const span = Math.max(h * PIN_SPAN, 1)
    return Math.min(Math.max(y / span, 0), 1)
  })
  const pin = useSpring(rawPin, PIN_SPRING)

  /*
    The canvas keeps its full-viewport drawing buffer and is scaled purely in
    CSS, so pinning costs a compositor transform and nothing else. Scaling
    happens about the element centre, which means the shape - drawn dead centre
    - simply follows the centre wherever the translation puts it.

    `pinnedSizeAt` re-derives the on-screen height from the *clamped* scale
    instead of assuming `target.size`; when a bound bites (short landscape
    viewports) that is the difference between honouring the inset and drifting
    away from the corner.
  */
  const pinnedScaleAt = (h: number) =>
    Math.min(Math.max(target.size / Math.max(heroFraction * h, 1), PIN_SCALE_MIN), PIN_SCALE_MAX)
  const pinnedSizeAt = (h: number) => pinnedScaleAt(h) * heroFraction * h

  const scale = useTransform<number, number>(
    [pin, viewportH],
    ([p, h]) => 1 + (pinnedScaleAt(h) - 1) * p,
  )
  const x = useTransform<number, number>([pin, viewportW, viewportH], ([p, w, h]) =>
    // Math.max keeps a viewport narrower than the pinned shape from pulling it
    // back past centre instead of out to the corner.
    p * Math.max(w / 2 - target.inset - pinnedSizeAt(h) / 2, 0),
  )
  const y = useTransform<number, number>([pin, viewportH], ([p, h]) =>
    p * Math.max(h / 2 - target.inset - pinnedSizeAt(h) / 2, 0),
  )
  const opacity = useTransform(pin, [0, 1], [1, PINNED_OPACITY])

  /* Pointer position, normalised to -1..1, read per frame inside the scene. */
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  useEffect(() => {
    // Reduced motion: parallax is never wired up at all, not merely ignored.
    if (reduced) return
    const onMove = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1)
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [pointerX, pointerY, reduced])

  // No WebGL, no canvas - the page is entirely readable without it.
  if (!supported) return null

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <motion.div
        className="absolute inset-0"
        style={{ x, y, scale, opacity, willChange: 'transform, opacity' }}
      >
        <SceneBoundary>
          <Suspense fallback={null}>
            <SceneCanvas
              pin={pin}
              velocity={scrollVelocity}
              pointerX={pointerX}
              pointerY={pointerY}
              reduced={reduced}
              simplified={simplified}
              paused={!pageVisible || !onScreen}
            />
          </Suspense>
        </SceneBoundary>
      </motion.div>
    </div>
  )
}
