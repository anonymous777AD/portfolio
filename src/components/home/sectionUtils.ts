import type { Aspect } from '../../types'

/**
 * URL-safe id derived from a category label. Every homepage section uses this
 * as its landmark id so the page has a real, linkable outline.
 */
export function sectionId(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'work'
}

/** Numeric width ÷ height for each supported aspect, for `calc()` sizing. */
export const ASPECT_SCALAR: Record<Aspect, number> = {
  '9:16': 9 / 16,
  '16:9': 16 / 9,
  '1:1': 1,
  '4:5': 4 / 5,
}

/** Two-digit ordinal used as the unobtrusive card index (01, 02 …). */
export function indexLabel(i: number): string {
  return String(i + 1).padStart(2, '0')
}
