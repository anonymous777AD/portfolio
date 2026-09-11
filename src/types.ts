/** Aspect ratios supported by the portfolio. */
export type Aspect = '9:16' | '16:9' | '1:1' | '4:5'

export const ASPECTS: readonly Aspect[] = ['16:9', '9:16', '1:1', '4:5']

/** CSS `aspect-ratio` values keyed by the JSON aspect string. */
export const ASPECT_RATIO: Record<Aspect, string> = {
  '9:16': '9 / 16',
  '16:9': '16 / 9',
  '1:1': '1 / 1',
  '4:5': '4 / 5',
}

export interface Category {
  id: string
  label: string
}

export interface Project {
  id: string
  name: string
  url: string
  category: string
  featured: boolean
  aspect: Aspect
}

export interface ProjectsData {
  categories: Category[]
  projects: Project[]
}

/** The one category id that can never be deleted. */
export const PROTECTED_CATEGORY_ID = 'featured'
