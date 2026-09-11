import { useEffect, useState } from 'react'
import CategoryManager from '../components/admin/CategoryManager'
import ImportExportBar from '../components/admin/ImportExportBar'
import LoginScreen from '../components/admin/LoginScreen'
import ProjectFormModal from '../components/admin/ProjectFormModal'
import ProjectTable from '../components/admin/ProjectTable'
import { BTN, BTN_PRIMARY, SECTION_TITLE } from '../components/admin/adminUi'
import { fetchProjectsFile } from '../components/admin/fetchProjectsFile'
import Loader from '../components/ui/Loader'
import { useAdminStore } from '../store/useAdminStore'
import { useAuthStore } from '../store/useAuthStore'
import type { Project } from '../types'

type SeedState = 'loading' | 'ready' | 'error'

/** `null` = closed, `'new'` = create, a project = edit that project. */
type FormTarget = Project | 'new' | null

/**
 * The hidden editor at /admin. Unlinked from the site on purpose: it exists to
 * rearrange the reel and export a new projects.json, not to be discovered.
 */
export default function AdminPage() {
  const authenticated = useAuthStore((state) => state.authenticated)
  const signOut = useAuthStore((state) => state.signOut)

  const categories = useAdminStore((state) => state.categories)
  const projects = useAdminStore((state) => state.projects)
  const dirty = useAdminStore((state) => state.dirty)
  const seedFromFile = useAdminStore((state) => state.seedFromFile)
  const addProject = useAdminStore((state) => state.addProject)
  const updateProject = useAdminStore((state) => state.updateProject)

  const [seedState, setSeedState] = useState<SeedState>('loading')
  const [seedError, setSeedError] = useState<string | null>(null)
  const [formTarget, setFormTarget] = useState<FormTarget>(null)

  // Seed from the deployed file once. seedFromFile is a no-op as soon as the
  // store holds local work, so this can never clobber unexported edits.
  useEffect(() => {
    let cancelled = false
    fetchProjectsFile()
      .then((data) => {
        if (cancelled) return
        seedFromFile(data)
        setSeedState('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setSeedError(error instanceof Error ? error.message : 'Could not load projects.json')
        setSeedState('error')
      })
    return () => {
      cancelled = true
    }
  }, [seedFromFile])

  if (!authenticated) return <LoginScreen />
  if (seedState === 'loading') return <Loader label="Opening editor" />

  return (
    <div data-admin-root className="min-h-dvh bg-ink text-bone" style={{ colorScheme: 'dark' }}>
      {/* The site replaces the pointer with a custom ring; a dense tool needs
          the real cursor back. Scoped to the admin subtree, undone on unmount. */}
      <style>{`
        body.has-custom-cursor #custom-cursor { display: none; }
        body.has-custom-cursor [data-admin-root],
        body.has-custom-cursor [data-admin-root] * { cursor: revert; }
      `}</style>

      <header className="sticky top-0 z-30 border-b border-ink-line bg-ink/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
          <h1 className="text-[12px] font-medium tracking-[0.3em] text-bone uppercase">Editor</h1>
          <p className="text-[11px] text-bone-faint">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} ·{' '}
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>

          <div className="ml-auto flex items-center gap-3">
            <p role="status" className="text-[11px]">
              {dirty ? (
                <span className="flex items-center gap-2 text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  Unexported changes
                </span>
              ) : (
                <span className="text-bone-faint">No unexported changes</span>
              )}
            </p>
            <button type="button" className={BTN} onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] space-y-8 px-4 py-8 sm:px-6">
        {seedState === 'error' && (
          <p
            role="alert"
            className="rounded-lg border border-[#4b2020] bg-[#180e0e] px-4 py-3 text-[12px] text-[#ff8f8f]"
          >
            Could not read the deployed projects.json ({seedError}). The editor is running on
            whatever is saved in this browser — export before you trust it.
          </p>
        )}

        <ImportExportBar />

        <section aria-labelledby="projects-title">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3">
            <h2 id="projects-title" className={SECTION_TITLE}>
              Projects
            </h2>
            <p className="text-[11px] text-bone-faint">
              Edit in place. Drag the grip to reorder within a category.
            </p>
            <button
              type="button"
              className={`${BTN_PRIMARY} ml-auto`}
              onClick={() => setFormTarget('new')}
            >
              Add project
            </button>
          </div>

          <ProjectTable onEdit={(project) => setFormTarget(project)} />
        </section>

        <CategoryManager />

        <p className="pb-6 text-[11px] text-bone-faint">
          Everything here lives in this browser until you export. Nothing is sent anywhere.
        </p>
      </main>

      {formTarget !== null && (
        <ProjectFormModal
          project={formTarget === 'new' ? null : formTarget}
          categories={categories}
          onClose={() => setFormTarget(null)}
          onSubmit={(values) => {
            if (formTarget === 'new') addProject(values)
            else updateProject(formTarget.id, values)
          }}
        />
      )}
    </div>
  )
}
