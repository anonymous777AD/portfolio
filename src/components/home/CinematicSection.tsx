import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { EASE_OUT_CUBIC, REVEAL_VIEWPORT } from '../../lib/motion'
import VideoSurface from '../ui/VideoSurface'
import type { Project } from '../../types'
import CategoryHeading from './CategoryHeading'
import { indexLabel, sectionId } from './sectionUtils'

interface CinematicSectionProps {
  label: string
  projects: Project[]
  onSelect: (id: string) => void
  /** Position of this section on the page — sets the alternation phase. */
  index: number
}

interface CinematicCardProps {
  project: Project
  position: number
  large: boolean
  delay: number
  reducedMotion: boolean
  onSelect: (id: string) => void
}

/** Widescreen card: soft glow, name and ordinal beneath, whole thing clickable. */
function CinematicCard({
  project,
  position,
  large,
  delay,
  reducedMotion,
  onSelect,
}: CinematicCardProps) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 0.7, ease: EASE_OUT_CUBIC, delay }}
      className="will-change-transform"
    >
      <button
        type="button"
        onClick={() => onSelect(project.id)}
        aria-label={`Play ${project.name}`}
        className="group block w-full text-left"
      >
        <div className="card-glow overflow-hidden rounded-[4px]">
          <VideoSurface
            project={project}
            previewWidth={large ? 960 : 720}
            className="w-full transition-opacity duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:opacity-95"
          />
        </div>

        <div className="mt-4 flex min-h-[44px] items-center gap-4">
          <span className="text-[10px] tracking-[0.3em] text-accent-dim tabular-nums">
            {indexLabel(position)}
          </span>
          <span
            className={`tracking-[0.2em] text-bone-dim uppercase transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:text-bone ${
              large ? 'text-xs' : 'text-[11px]'
            }`}
          >
            {project.name}
          </span>
        </div>
      </button>
    </motion.div>
  )
}

/** Split into pairs so each row can flip its weighting. */
function toRows(projects: Project[]): Project[][] {
  const rows: Project[][] = []
  for (let i = 0; i < projects.length; i += 2) rows.push(projects.slice(i, i + 2))
  return rows
}

/**
 * Widescreen work in an alternating asymmetric rhythm: large-left / small-right,
 * then the mirror on the next row. A lone trailing clip becomes a wide,
 * deliberately off-centre slot rather than a half-empty row.
 */
export default function CinematicSection({
  label,
  projects,
  onSelect,
  index,
}: CinematicSectionProps) {
  const reducedMotion = usePrefersReducedMotion()

  if (projects.length === 0) return null

  const rows = toRows(projects)

  return (
    <section
      id={sectionId(label)}
      aria-label={label}
      className="relative px-5 py-24 sm:px-8 md:py-40 lg:px-12"
    >
      <div className="mx-auto max-w-[1500px]">
        <CategoryHeading label={label} eyebrow="Widescreen" count={projects.length} />

        <div className="mt-14 flex flex-col gap-16 md:mt-24 md:gap-28 lg:gap-36">
          {rows.map((row, r) => {
            const flip = (r + index) % 2 === 1
            const solo = row.length === 1

            return (
              <div
                key={row[0].id}
                className="grid grid-cols-1 gap-12 md:grid-cols-12 md:items-start md:gap-10 lg:gap-14"
              >
                <div
                  className={
                    solo
                      ? flip
                        ? 'md:col-span-8 md:col-start-5'
                        : 'md:col-span-8 md:col-start-1'
                      : flip
                        ? 'md:col-span-7 md:col-start-6'
                        : 'md:col-span-7 md:col-start-1'
                  }
                >
                  <CinematicCard
                    project={row[0]}
                    position={r * 2}
                    large
                    delay={flip ? 0.08 : 0}
                    reducedMotion={reducedMotion}
                    onSelect={onSelect}
                  />
                </div>

                {row[1] && (
                  <div
                    className={
                      flip
                        ? 'md:col-span-4 md:col-start-1 md:row-start-1 md:mt-20'
                        : 'md:col-span-4 md:col-start-9 md:mt-20'
                    }
                  >
                    <CinematicCard
                      project={row[1]}
                      position={r * 2 + 1}
                      large={false}
                      delay={flip ? 0 : 0.08}
                      reducedMotion={reducedMotion}
                      onSelect={onSelect}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
