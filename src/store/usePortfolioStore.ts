import { create } from 'zustand'
import type { Category, Project, ProjectsData } from '../types'

interface PortfolioState {
  categories: Category[]
  projects: Project[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  /** The project currently open in the lightbox, if any. */
  activeProjectId: string | null
  load: () => Promise<void>
  openProject: (id: string) => void
  closeProject: () => void
}

function isProjectsData(value: unknown): value is ProjectsData {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Partial<ProjectsData>
  return Array.isArray(data.categories) && Array.isArray(data.projects)
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  categories: [],
  projects: [],
  status: 'idle',
  error: null,
  activeProjectId: null,

  load: async () => {
    if (get().status === 'loading' || get().status === 'ready') return
    set({ status: 'loading', error: null })
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}projects.json`, { cache: 'no-cache' })
      if (!res.ok) throw new Error(`projects.json responded ${res.status}`)
      const data: unknown = await res.json()
      if (!isProjectsData(data)) throw new Error('projects.json is malformed')
      set({
        categories: data.categories,
        projects: data.projects,
        status: 'ready',
      })
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to load projects' })
    }
  },

  openProject: (id) => set({ activeProjectId: id }),
  closeProject: () => set({ activeProjectId: null }),
}))

/** Projects flagged `featured`, in file order. */
export function selectFeatured(state: PortfolioState): Project[] {
  return state.projects.filter((p) => p.featured)
}

/** Projects belonging to a category, in file order. */
export function selectByCategory(state: PortfolioState, categoryId: string): Project[] {
  return state.projects.filter((p) => p.category === categoryId)
}
