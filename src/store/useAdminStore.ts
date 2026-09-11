import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ASPECTS, PROTECTED_CATEGORY_ID } from '../types'
import type { Aspect, Category, Project, ProjectsData } from '../types'

export interface AdminState {
  categories: Category[]
  projects: Project[]
  /** Set once the store has been seeded from /projects.json (or from localStorage). */
  hydratedFromFile: boolean
  /** Bumped on every mutation so the UI can flag unexported edits. */
  dirty: boolean

  seedFromFile: (data: ProjectsData) => void
  addProject: (project: Omit<Project, 'id'> & { id?: string }) => void
  updateProject: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  deleteProject: (id: string) => void
  toggleFeatured: (id: string) => void
  /** Move a project within its own category by array indices local to that category. */
  reorderWithinCategory: (categoryId: string, from: number, to: number) => void

  addCategory: (label: string) => void
  renameCategory: (id: string, label: string) => void
  deleteCategory: (id: string) => void

  importData: (data: ProjectsData) => void
  exportData: () => ProjectsData
  resetToFile: (data: ProjectsData) => void
}

/** Turn a display name into a url-safe, collision-free id. */
export function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'item'
}

export function uniqueId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

function isAspect(value: unknown): value is Aspect {
  return typeof value === 'string' && (ASPECTS as readonly string[]).includes(value)
}

/**
 * Validate and normalise an arbitrary parsed JSON blob into ProjectsData.
 * Throws with a human-readable message when the shape is wrong — the import
 * UI surfaces that message directly.
 */
export function parseProjectsData(value: unknown): ProjectsData {
  if (typeof value !== 'object' || value === null) throw new Error('File is not a JSON object')
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.categories)) throw new Error('Missing a "categories" array')
  if (!Array.isArray(raw.projects)) throw new Error('Missing a "projects" array')

  const categories: Category[] = raw.categories.map((entry, i) => {
    const c = entry as Record<string, unknown>
    if (typeof c?.id !== 'string' || typeof c?.label !== 'string') {
      throw new Error(`Category #${i + 1} needs a string "id" and "label"`)
    }
    return { id: c.id, label: c.label }
  })

  const projects: Project[] = raw.projects.map((entry, i) => {
    const p = entry as Record<string, unknown>
    if (typeof p?.name !== 'string' || typeof p?.url !== 'string') {
      throw new Error(`Project #${i + 1} needs a string "name" and "url"`)
    }
    return {
      id: typeof p.id === 'string' && p.id ? p.id : slugify(p.name),
      name: p.name,
      url: p.url,
      category: typeof p.category === 'string' ? p.category : '',
      featured: p.featured === true,
      aspect: isAspect(p.aspect) ? p.aspect : '16:9',
    }
  })

  return { categories, projects }
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      categories: [],
      projects: [],
      hydratedFromFile: false,
      dirty: false,

      seedFromFile: (data) => {
        // Never clobber local edits — seeding only fills an empty store.
        if (get().hydratedFromFile) return
        set({
          categories: data.categories,
          projects: data.projects,
          hydratedFromFile: true,
          dirty: false,
        })
      },

      addProject: (project) =>
        set((state) => {
          const id = uniqueId(
            project.id || slugify(project.name),
            state.projects.map((p) => p.id),
          )
          return {
            projects: [...state.projects, { ...project, id } as Project],
            dirty: true,
          }
        }),

      updateProject: (id, patch) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          dirty: true,
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          dirty: true,
        })),

      toggleFeatured: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p)),
          dirty: true,
        })),

      reorderWithinCategory: (categoryId, from, to) =>
        set((state) => {
          // Absolute indices of this category's projects inside the flat list.
          const slots: number[] = []
          state.projects.forEach((p, i) => {
            if (p.category === categoryId) slots.push(i)
          })
          if (from < 0 || to < 0 || from >= slots.length || to >= slots.length || from === to) {
            return state
          }
          const members = slots.map((i) => state.projects[i])
          const [moved] = members.splice(from, 1)
          members.splice(to, 0, moved)
          const next = [...state.projects]
          slots.forEach((absolute, i) => {
            next[absolute] = members[i]
          })
          return { projects: next, dirty: true }
        }),

      addCategory: (label) =>
        set((state) => {
          const id = uniqueId(
            slugify(label),
            state.categories.map((c) => c.id),
          )
          return { categories: [...state.categories, { id, label }], dirty: true }
        }),

      renameCategory: (id, label) =>
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, label } : c)),
          dirty: true,
        })),

      deleteCategory: (id) =>
        set((state) => {
          if (id === PROTECTED_CATEGORY_ID) return state
          return {
            categories: state.categories.filter((c) => c.id !== id),
            // Orphaned projects keep their old category string; the table flags
            // them as uncategorised so nothing silently disappears.
            projects: state.projects.map((p) => (p.category === id ? { ...p, category: '' } : p)),
            dirty: true,
          }
        }),

      importData: (data) =>
        set({
          categories: data.categories,
          projects: data.projects,
          hydratedFromFile: true,
          dirty: false,
        }),

      exportData: () => {
        const { categories, projects } = get()
        return { categories, projects }
      },

      resetToFile: (data) =>
        set({
          categories: data.categories,
          projects: data.projects,
          hydratedFromFile: true,
          dirty: false,
        }),
    }),
    {
      name: 'portfolio-admin-v1',
      partialize: (state) => ({
        categories: state.categories,
        projects: state.projects,
        hydratedFromFile: state.hydratedFromFile,
        dirty: state.dirty,
      }),
    },
  ),
)
