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

export interface KnotMeshProps {
  /** 0 while the canvas is full-bleed, 1 once it has pinned to the corner. */
  pin: MotionValue<number>
  /** Raw scroll velocity in px/s — read per frame, never subscribed to. */
  velocity: MotionValue<number>
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
  reduced: boolean
  simplified: boolean
}

export default function KnotMesh({
  pin,
  velocity,
  pointerX,
  pointerY,
  reduced,
  simplified,
}: KnotMeshProps) {
  const knot = useRef<Group>(null)
  const material = useRef<ComponentRef<typeof MeshDistortMaterial>>(null)
  const spin = useRef(0)
  const drift = useRef({ x: 0, y: 0 })
  const invalidate = useThree((state) => state.invalidate)

  // torusKnotGeometry: [radius, tube, tubularSegments, radialSegments, p, q]
  const geometry = useMemo<[number, number, number, number, number, number]>(
    () => (simplified ? [1, 0.32, 128, 14, 2, 3] : [1, 0.32, 256, 32, 2, 3]),
    [simplified],
  )

  /**
   * Under reduced motion the loop runs on demand, so nudge it once after mount
   * to be certain the environment probe and the material have both landed.
   */
  useEffect(() => {
    if (!reduced) return
    invalidate()
    const id = window.setTimeout(invalidate, 240)
    return () => window.clearTimeout(id)
  }, [invalidate, reduced])

  useFrame((state, delta) => {
    const group = knot.current
    // Reduced motion: the shape is a still object. It still pins with scroll,
    // but nothing here animates it.
    if (!group || reduced) return

    const dt = Math.min(delta, 1 / 30)
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
    group.position.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.16 * reach

    const surface = material.current
    if (surface) {
      surface.distort = MathUtils.damp(
        surface.distort,
        BASE_DISTORT + rush * weight * 0.26,
        3.5,
        dt,
      )
    }
  })

  return (
    <>
      {/* Punctual lights carry the crisp speculars; the environment does the colour. */}
      <directionalLight position={[4, 6, 8]} intensity={1.5} />
      <pointLight position={[-7, -3, -5]} intensity={90} distance={30} decay={2} color="#00e5ff" />
      <pointLight position={[6, 5, -7]} intensity={55} distance={30} decay={2} color="#7b61ff" />

      {/*
        A hand-built studio rendered once into a cube target — no HDR fetch, no
        network, and the render loop never touches it again after mount.
      */}
      <Environment resolution={simplified ? 64 : 128} frames={1}>
        <color attach="background" args={['#05060a']} />
        <Lightformer form="rect" intensity={2.2} color="#ffffff" scale={[12, 5, 1]} position={[0, 7, -6]} />
        <Lightformer form="circle" intensity={5} color="#00e5ff" scale={6} position={[-9, 1.5, 5]} />
        <Lightformer form="ring" intensity={3.5} color="#6d5cff" scale={8} position={[9, -4, 3]} />
        {!simplified && (
          <>
            <Lightformer form="rect" intensity={1.6} color="#f2f0ec" scale={[3, 10, 1]} position={[10, 3, -3]} />
            <Lightformer form="rect" intensity={1.1} color="#0d2530" scale={[14, 14, 1]} position={[0, 0, -14]} />
          </>
        )}
      </Environment>

      <group ref={knot} rotation={REST_ROTATION} scale={simplified ? SIMPLIFIED_SCALE : 1}>
        <mesh>
          <torusKnotGeometry args={geometry} />
          <MeshDistortMaterial
            ref={material}
            speed={reduced ? 0 : 0.55}
            distort={BASE_DISTORT}
            radius={1}
            color="#0e1116"
            metalness={0.92}
            roughness={0.19}
            iridescence={1}
            iridescenceIOR={1.6}
            iridescenceThicknessRange={[120, 640]}
            clearcoat={1}
            clearcoatRoughness={0.16}
            envMapIntensity={1.4}
          />
        </mesh>
      </group>
    </>
  )
}
