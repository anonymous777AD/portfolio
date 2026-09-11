import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import CinematicSection from '../components/home/CinematicSection'
import FeaturedSection from '../components/home/FeaturedSection'
import Hero from '../components/home/Hero'
import SiteFooter from '../components/home/SiteFooter'
import UgcSection from '../components/home/UgcSection'
import Loader from '../components/ui/Loader'
import ProjectModal from '../components/ui/ProjectModal'
import Scene3D from '../components/three/Scene3D'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { usePortfolioStore } from '../store/usePortfolioStore'
import { PROTECTED_CATEGORY_ID } from '../types'
import type { Project } from '../types'

export default function HomePage() {
  const reducedMotion = usePrefersReducedMotion()
  useSmoothScroll(!reducedMotion)

  const { categories, projects, status, error, activeProjectId } = usePortfolioStore(
    useShallow((s) => ({
      categories: s.categories,
      projects: s.projects,
      status: s.status,
      error: s.error,
      activeProjectId: s.activeProjectId,
    })),
  )
  const load = usePortfolioStore((s) => s.load)
  const openProject = usePortfolioStore((s) => s.openProject)
  const closeProject = usePortfolioStore((s) => s.closeProject)

  useEffect(() => {
    void load()
  }, [load])

  const featured = useMemo(() => projects.filter((p) => p.featured), [projects])

  /**
   * Everything except the synthetic `featured` bucket, in the order the JSON
   * declares. Layout is chosen by the shape of the work, not a hard-coded id,
   * so a category added in /admin lands in a sensible grid automatically.
   */
  const sections = useMemo(() => {
    return categories
      .filter((category) => category.id !== PROTECTED_CATEGORY_ID)
      .map((category) => {
        const items = projects.filter((p) => p.category === category.id)
        const portrait = items.filter((p) => p.aspect === '9:16' || p.aspect === '4:5').length
        return {
          category,
          items,
          layout: portrait > items.length / 2 ? ('portrait' as const) : ('cinematic' as const),
        }
      })
      .filter((section) => section.items.length > 0)
  }, [categories, projects])

  /** Flat running order used by the lightbox's ←/→ keys. */
  const ordered = useMemo<Project[]>(
    () => [...featured, ...sections.flatMap((s) => s.items)],
    [featured, sections],
  )

  const activeProject = useMemo(
    () => ordered.find((p) => p.id === activeProjectId) ?? null,
    [ordered, activeProjectId],
  )

  const step = useCallback(
    (delta: number) => {
      if (!activeProject || ordered.length === 0) return
      const index = ordered.findIndex((p) => p.id === activeProject.id)
      const next = ordered[(index + delta + ordered.length) % ordered.length]
      openProject(next.id)
    },
    [activeProject, ordered, openProject],
  )

  if (status === 'error') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-ink px-6 text-center">
        <div>
          <h1 className="display-type text-3xl text-bone">Nothing to show</h1>
          <p className="mt-3 text-sm text-bone-faint">{error}</p>
        </div>
      </main>
    )
  }

  if (status !== 'ready') return <Loader />

  return (
    <>
      {/* Persistent 3D layer: full-bleed behind the hero, pinned to a corner after. */}
      <Scene3D />

      <main className="relative z-10">
        <Hero />

        <FeaturedSection
          label="Best Work"
          slug="best-work"
          projects={featured}
          onSelect={openProject}
          index={0}
        />

        {sections.map((section, i) =>
          section.layout === 'portrait' ? (
            <UgcSection
              key={section.category.id}
              label={section.category.label}
              slug={section.category.id}
              projects={section.items}
              onSelect={openProject}
              index={i + 1}
            />
          ) : (
            <CinematicSection
              key={section.category.id}
              label={section.category.label}
              slug={section.category.id}
              projects={section.items}
              onSelect={openProject}
              index={i + 1}
            />
          ),
        )}

        <SiteFooter />
      </main>

      <ProjectModal project={activeProject} onClose={closeProject} onStep={step} />
    </>
  )
}
