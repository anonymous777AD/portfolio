import { Canvas } from '@react-three/fiber'
import type { MotionValue } from 'framer-motion'
import KnotMesh from './KnotMesh'
import { CAMERA_DISTANCE, CAMERA_FOV } from './sceneConfig'

/*
  Hoisted out of the render so their identity is stable: R3F re-runs
  `configure()` on every render of <Canvas>, and react-use-measure rebuilds its
  debounce closures whenever the `resize` object changes identity.
*/

/**
 * `offsetSize` measures layout px (offsetWidth/offsetHeight), so the CSS
 * transform that pins the container never triggers a drawing-buffer resize -
 * the default getBoundingClientRect path reports the *transformed* size and
 * would call gl.setSize on every scroll frame. `scroll: false` takes
 * measurement off the scroll path entirely. Do not remove either.
 */
const RESIZE = { scroll: false, offsetSize: true, debounce: { scroll: 0, resize: 0 } } as const

const GL = { antialias: true, powerPreference: 'high-performance', alpha: true } as const
const CAMERA = {
  fov: CAMERA_FOV,
  position: [0, 0, CAMERA_DISTANCE] as [number, number, number],
  near: 1,
  far: 60,
}
const DPR_FULL: [number, number] = [1, 1.75]
const DPR_SIMPLE: [number, number] = [1, 1.5]
const CANVAS_STYLE = { pointerEvents: 'none' } as const

export interface SceneCanvasProps {
  pin: MotionValue<number>
  velocity: MotionValue<number>
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
  reduced: boolean
  simplified: boolean
  /** Tab hidden or host element off screen - stop the loop entirely. */
  paused: boolean
}

/**
 * Everything that pulls in `three` lives behind this module so the WebGL code
 * splits into its own chunk and never blocks first paint.
 */
export default function SceneCanvas({
  pin,
  velocity,
  pointerX,
  pointerY,
  reduced,
  simplified,
  paused,
}: SceneCanvasProps) {
  const frameloop = paused ? 'never' : reduced ? 'demand' : 'always'

  return (
    <Canvas
      frameloop={frameloop}
      dpr={simplified ? DPR_SIMPLE : DPR_FULL}
      gl={GL}
      camera={CAMERA}
      resize={RESIZE}
      style={CANVAS_STYLE}
    >
      <KnotMesh
        pin={pin}
        velocity={velocity}
        pointerX={pointerX}
        pointerY={pointerY}
        reduced={reduced}
        simplified={simplified}
        paused={paused}
      />
    </Canvas>
  )
}
