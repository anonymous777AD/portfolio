import { parseProjectsData } from '../../store/useAdminStore'
import type { ProjectsData } from '../../types'

/**
 * Read the deployed `public/projects.json` and validate it.
 *
 * Used both for the initial seed and for "revert to deployed" — the two places
 * that treat the committed file as the source of truth. Always throws an Error
 * with a message fit to show a human.
 */
export async function fetchProjectsFile(): Promise<ProjectsData> {
  const res = await fetch(`${import.meta.env.BASE_URL}projects.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`projects.json responded ${res.status}`)

  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    throw new Error('projects.json is not valid JSON')
  }

  return parseProjectsData(raw)
}
