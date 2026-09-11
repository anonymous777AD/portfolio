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

/**
 * Categories a project can actually be filed under.
 *
 * `featured` is a flag, not a bucket: the "Best Work" section is built from
 * every project whose `featured` flag is set, and the homepage skips the
 * category itself when laying out sections. A project filed under it would
 * therefore render nowhere unless it also happened to be flagged, so it is
 * never offered as a destination.
 */
export function assignableCategories(categories: Category[]): Category[] {
  return categories.filter((category) => category.id !== PROTECTED_CATEGORY_ID)
}
