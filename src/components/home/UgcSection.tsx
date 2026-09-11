import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { EASE_OUT_CUBIC, REVEAL_VIEWPORT } from '../../lib/motion'
import VideoSurface from '../ui/VideoSurface'
import type { Project } from '../../types'
import CategoryHeading from './CategoryHeading'
import { sectionId } from './sectionUtils'

interface UgcSectionProps {
  label: string
  projects: Project[]
  onSelect: (id: string) => void
  /** Position of this section on the page — offsets the reveal stagger. */
  index: number
}

/** Max degrees of rotation at the very corners of a card. */
const TILT_RANGE = 7
const TILT_SPRING = { stiffness: 190, damping: 20, mass: 0.55 } as const

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

function readFinePointer(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(FINE_POINTER_QUERY).matches
}

/** True only on devices that actually hover with a precise pointer. */
function useFinePointer(): boolean {
  const [fine, setFine] = useState(readFinePointer)

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia(FINE_POINTER_QUERY)
    const onChange = (event: MediaQueryListEvent) => setFine(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return fine
}

interface PhoneCardProps {
  project: Project
  position: number
  tilt: boolean
  reducedMotion: boolean
  onSelect: (id: string) => void
}

/**
 * A single portrait clip in a minimal phone frame: thin bezel, inner ring, deep
 * shadow, no toy notch. On a real pointer the frame tips towards the cursor.
 */
function PhoneCard({ project, position, tilt, reducedMotion, onSelect }: PhoneCardProps) {
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const rotateX = useSpring(tiltX, TILT_SPRING)
  const rotateY = useSpring(tiltY, TILT_SPRING)

  const handleMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!tilt || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    tiltY.set(px * TILT_RANGE * 2)
    tiltX.set(-py * TILT_RANGE * 2)
  }

  const settle = () => {
    tiltX.set(0)
    tiltY.set(0)
  }

  return (
    <li className="[perspective:1200px]">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 42 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={REVEAL_VIEWPORT}
        transition={{ duration: 0.7, ease: EASE_OUT_CUBIC, delay: (position % 3) * 0.09 }}
      >
        <motion.button
          type="button"
          onClick={() => onSelect(project.id)}
          onPointerMove={handleMove}
          onPointerLeave={settle}
          onBlur={settle}
          aria-label={`Play ${project.name}`}
          style={tilt ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
          whileHover={tilt ? { scale: 1.025 } : undefined}
          transition={{ duration: 0.5, ease: EASE_OUT_CUBIC }}
          className="group mx-auto block w-full max-w-[320px] text-left will-change-transform lg:max-w-[360px]"
        >
          <div className="rounded-[2rem] border border-ink-line bg-ink-raised p-[6px] shadow-[0_50px_90px_-45px_rgba(0,0,0,0.95)] ring-1 ring-white/5 ring-inset">
            <VideoSurface
              project={project}
              previewWidth={480}
              className="w-full rounded-[1.65rem] ring-1 ring-white/5 ring-inset"
            />
          </div>

          <div className="mt-4 flex min-h-[44px] items-center justify-center gap-3 px-2 text-center">
            <span className="text-xs tracking-[0.2em] text-bone-dim uppercase transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:text-bone">
              {project.name}
            </span>
          </div>
        </motion.button>
      </motion.div>
    </li>
  )
}

/**
 * Portrait work, shown as a grid of phone mockups: three up on desktop, two on
 * tablet, one on mobile.
 */
export default function UgcSection({ label, projects, onSelect, index }: UgcSectionProps) {
  const reducedMotion = usePrefersReducedMotion()
  const finePointer = useFinePointer()
  const tilt = finePointer && !reducedMotion

  if (projects.length === 0) return null

  return (
    <section
      id={sectionId(label)}
      aria-label={label}
      className="relative px-5 py-24 sm:px-8 md:py-40 lg:px-12"
    >
      <div className="mx-auto max-w-[1500px]">
        <CategoryHeading label={label} eyebrow="Vertical" count={projects.length} />

        <ul className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-2 md:mt-24 md:gap-14 lg:grid-cols-3 lg:gap-16">
          {projects.map((project, i) => (
            <PhoneCard
              key={project.id}
              project={project}
              position={i + index}
              tilt={tilt}
              reducedMotion={reducedMotion}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
