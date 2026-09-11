import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { EASE_OUT_CUBIC, REVEAL_VIEWPORT } from '../../lib/motion'
import VideoSurface from '../ui/VideoSurface'
import type { Project } from '../../types'
import CategoryHeading from './CategoryHeading'
import { ASPECT_SCALAR, indexLabel, sectionId } from './sectionUtils'

interface FeaturedSectionProps {
  label: string
  projects: Project[]
  onSelect: (id: string) => void
  /** Position of this section on the page — sets the alternation phase. */
  index: number
}

interface FeaturedCardProps {
  project: Project
  position: number
  flip: boolean
  reducedMotion: boolean
  onSelect: (id: string) => void
}

/**
 * One hero-scale card. Height comes from the `--feat-h` custom property set on
 * the section; width is derived from the clip's own aspect, so a portrait cut
 * simply comes out narrower instead of being cropped to fit.
 */
function FeaturedCard({ project, position, flip, reducedMotion, onSelect }: FeaturedCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const parallax = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [64, -64])

  return (
    <div ref={ref} className={`flex w-full ${flip ? 'md:justify-end' : ''}`}>
      <motion.div
        // min() keeps the card inside the gutters at every width.
        style={{
          y: parallax,
          maxWidth: `min(100%, calc(var(--feat-h, 70vh) * ${ASPECT_SCALAR[project.aspect]}))`,
        }}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={REVEAL_VIEWPORT}
        transition={{ duration: 0.7, ease: EASE_OUT_CUBIC }}
        className="w-full will-change-transform"
      >
        <button
          type="button"
          onClick={() => onSelect(project.id)}
          aria-label={`Play ${project.name}`}
          className="group block w-full text-left"
        >
          <div className="overflow-hidden rounded-[4px] shadow-[0_60px_120px_-60px_rgba(0,0,0,0.95)]">
            <VideoSurface
              project={project}
              previewWidth={1280}
              kenBurns
              className="w-full transition-opacity duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:opacity-95"
            />
          </div>

          <div className="mt-5 flex min-h-[44px] items-center gap-5">
            <span className="text-[10px] tracking-[0.3em] text-accent-dim tabular-nums">
              {indexLabel(position)}
            </span>
            <span className="text-xs tracking-[0.22em] text-bone-dim uppercase transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:text-bone">
              {project.name}
            </span>
            <span
              aria-hidden="true"
              className="hidden h-px flex-1 origin-left scale-x-0 bg-ink-line transition-transform duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-x-100 sm:block"
            />
          </div>
        </button>
      </motion.div>
    </div>
  )
}

/**
 * "Best Work": the large-format reel. One clip per row, alternating alignment,
 * each entering with a scale-up and drifting on its own scroll-driven parallax.
 */
export default function FeaturedSection({
  label,
  projects,
  onSelect,
  index,
}: FeaturedSectionProps) {
  // Read once for the whole section rather than opening a matchMedia
  // subscription per card.
  const reducedMotion = usePrefersReducedMotion()

  if (projects.length === 0) return null

  return (
    <section
      id={sectionId(label)}
      aria-label={label}
      className="relative px-5 py-24 [--feat-h:58vh] sm:px-8 md:py-40 md:[--feat-h:78vh] lg:px-12"
    >
      <div className="mx-auto max-w-[1500px]">
        <CategoryHeading label={label} eyebrow="Selected" count={projects.length} />

        <div className="mt-14 flex flex-col gap-24 md:mt-24 md:gap-40">
          {projects.map((project, i) => (
            <FeaturedCard
              key={project.id}
              project={project}
              position={i}
              flip={(i + index) % 2 === 1}
              reducedMotion={reducedMotion}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
