import { useEffect, useMemo, useRef } from 'react'
import type { ComponentRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshDistortMaterial } from '@react-three/drei'
import { MathUtils } from 'three'
import type { Group } from 'three'
import type { MotionValue } from 'framer-motion'
import { SIMPLIFIED_SCALE } from './sceneConfig'

/** Resting distortion. Scroll velocity pushes past this and eases back down. */
const BASE_DISTORT = 0.3
/** Fixed tilt so the knot never presents a flat, symmetrical silhouette. */
const REST_ROTATION: [number, number, number] = [0.42, 0.55, 0.08]
/** Radians per second of the ambient turn, before any scroll energy. */
const IDLE_SPIN = 0.16
/** Scroll speed (px/s) that counts as "flat out" for the velocity reaction. */
const VELOCITY_REFERENCE = 1800

/* Palette: near-black ground, off-white ink, one accent - electric cyan. */
const INK = '#0a0a0a'
const INK_RAISED = '#121212'
const BONE = '#f2f0ec'
const ACCENT = '#00e5ff'
const ACCENT_DIM = '#0097ab'

export interface KnotMeshProps {
  /** 0 while the canvas is full-bleed, 1 once it has pinned to the corner. */
  pin: MotionValue<number>
  /** Raw scroll velocity in px/s - read per frame, never subscribed to. */
  velocity: MotionValue<number>
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
  reduced: boolean
  simplified: boolean
  /** Mirrors the canvas frameloop going to 'never'. */
  paused: boolean
}

export default function KnotMesh({
  pin,
  velocity,
  pointerX,
  pointerY,
  reduced,
  simplified,
  paused,
}: KnotMeshProps) {
  const knot = useRef<Group>(null)
  const material = useRef<ComponentRef<typeof MeshDistortMaterial>>(null)
  const spin = useRef(0)
  /*
    Own clock. R3F's `setFrameloop` resets `state.clock.elapsedTime` to 0 on
    every frameloop change, so anything derived from it would jump the moment
    the tab is hidden and shown again.
  */
  const elapsed = useRef(0)
  const drift = useRef({ x: 0, y: 0 })
  const invalidate = useThree((state) => state.invalidate)

  // torusKnotGeometry: [radius, tube, tubularSegments, radialSegments, p, q]
  const geometry = useMemo<[number, number, number, number, number, number]>(
    () => (simplified ? [1, 0.32, 128, 14, 2, 3] : [1, 0.32, 256, 32, 2, 3]),
    [simplified],
  )

  /**
   * Restarting after a pause is not automatic. R3F's rAF driver stops itself
   * once no root wants a frame, and `setFrameloop` only writes state - nothing
   * re-arms the loop. `invalidate()` is what re-arms it, but it is a no-op
   * while the frameloop is still 'never', and the Canvas sets that
   * asynchronously. So: nudge now, on the next animation frame, and once more
   * after the renderer has settled. The same cascade gives the reduced-motion
   * 'demand' loop the frames it needs for the environment probe to land.
   */
  useEffect(() => {
    if (paused) return
    invalidate()
    const raf = requestAnimationFrame(() => invalidate())
    const timer = window.setTimeout(invalidate, 250)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [invalidate, paused])

  useFrame((_, delta) => {
    const group = knot.current
    // Reduced motion: the shape is a still object. It still pins with scroll,
    // but nothing here animates it.
    if (!group || reduced) return

    const dt = Math.min(delta, 1 / 30)
    elapsed.current += dt
    const pinned = pin.get()
    const rush = Math.min(Math.abs(velocity.get()) / VELOCITY_REFERENCE, 1)
    // Velocity has a light touch in the hero and takes over once pinned.
    const weight = 0.3 + 0.7 * pinned

    spin.current += dt * (IDLE_SPIN + rush * weight * 2.6)

    // Pointer parallax, eased toward the target rather than snapped to it, and
    // faded out as the shape retreats into the corner.
    const reach = 1 - pinned
    drift.current.x = MathUtils.damp(drift.current.x, pointerY.get() * 0.2 * reach, 2.6, dt)
    drift.current.y = MathUtils.damp(drift.current.y, pointerX.get() * 0.34 * reach, 2.6, dt)

    group.rotation.x = REST_ROTATION[0] + Math.sin(spin.current * 0.6) * 0.14 + drift.current.x
    group.rotation.y = REST_ROTATION[1] + spin.current + drift.current.y
    group.rotation.z = REST_ROTATION[2] + Math.sin(spin.current * 0.31) * 0.1
    group.position.y = Math.sin(elapsed.current * 0.45) * 0.16 * reach

    const surface = material.current
    if (surface) {
      surface.distort = MathUtils.damp(
        surface.distort,
        BASE_DISTORT + rush * weight * 0.22,
        3.5,
        dt,
      )
    }
  })

  return (
    <>
      {/* Punctual lights carry the crisp speculars; the environment does the colour. */}
      <directionalLight position={[4, 6, 8]} intensity={1.5} />
      <pointLight position={[-7, -3, -5]} intensity={90} distance={30} decay={2} color={ACCENT} />
      <pointLight position={[6, 5, -7]} intensity={55} distance={30} decay={2} color={BONE} />

      {/*
        A hand-built studio rendered once into a cube target - no HDR fetch, no
        network, and the render loop never touches it again after mount.
      */}
      <Environment resolution={simplified ? 64 : 128} frames={1}>
        <color attach="background" args={[INK]} />
        <Lightformer form="rect" intensity={2.2} color={BONE} scale={[12, 5, 1]} position={[0, 7, -6]} />
        <Lightformer form="circle" intensity={5} color={ACCENT} scale={6} position={[-9, 1.5, 5]} />
        <Lightformer form="ring" intensity={3.5} color={ACCENT_DIM} scale={8} position={[9, -4, 3]} />
        {!simplified && (
          <>
            <Lightformer form="rect" intensity={1.6} color={BONE} scale={[3, 10, 1]} position={[10, 3, -3]} />
            <Lightformer form="rect" intensity={1.1} color={INK} scale={[14, 14, 1]} position={[0, 0, -14]} />
          </>
        )}
      </Environment>

      <group ref={knot} rotation={REST_ROTATION} scale={simplified ? SIMPLIFIED_SCALE : 1}>
        <mesh>
          <torusKnotGeometry args={geometry} />
          {/*
            Iridescence is kept narrow-band on purpose: a wide thickness range
            sweeps the full spectrum, which would put a second and third accent
            hue on the page. This range stays in the blue/cyan lobe.
          */}
          <MeshDistortMaterial
            ref={material}
            speed={reduced ? 0 : 0.55}
            distort={BASE_DISTORT}
            radius={1}
            color={INK_RAISED}
            metalness={0.92}
            roughness={0.19}
            iridescence={0.7}
            iridescenceIOR={1.6}
            iridescenceThicknessRange={[180, 400]}
            clearcoat={1}
            clearcoatRoughness={0.16}
            envMapIntensity={1.4}
          />
        </mesh>
      </group>
    </>
  )
}
