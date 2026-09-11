import { Canvas } from '@react-three/fiber'
import type { MotionValue } from 'framer-motion'
import KnotMesh from './KnotMesh'
import { CAMERA_DISTANCE, CAMERA_FOV } from './sceneConfig'

export interface SceneCanvasProps {
  pin: MotionValue<number>
  velocity: MotionValue<number>
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
  reduced: boolean
  simplified: boolean
  /** Tab hidden or host element off screen — stop the loop entirely. */
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
      dpr={simplified ? [1, 1.5] : [1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_DISTANCE], near: 1, far: 60 }}
      /*
        `offsetSize` measures layout px, so the CSS transform that pins the
        container never triggers a drawing-buffer resize; `scroll: false` keeps
        the measurement off the scroll path entirely.
      */
      resize={{ scroll: false, offsetSize: true, debounce: { scroll: 0, resize: 0 } }}
      style={{ pointerEvents: 'none' }}
    >
      <KnotMesh
        pin={pin}
        velocity={velocity}
        pointerX={pointerX}
        pointerY={pointerY}
        reduced={reduced}
        simplified={simplified}
      />
    </Canvas>
  )
}
