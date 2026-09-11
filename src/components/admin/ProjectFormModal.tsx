import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ASPECTS } from '../../types'
import type { Aspect, Category, Project } from '../../types'
import { BTN, BTN_PRIMARY, FIELD, HINT, LABEL, SELECT } from './adminUi'

interface ProjectFormModalProps {
  /** `null` creates a new project; a project edits it in place. */
  project: Project | null
  categories: Category[]
  onSubmit: (values: Omit<Project, 'id'>) => void
  onClose: () => void
}

interface Errors {
  name?: string
  url?: string
}

const FOCUSABLE = 'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Add / edit dialog. Mounted only while open, so focus capture and restore fall
 * out of the mount lifecycle. Escape and backdrop click both close; Tab is
 * trapped inside the panel.
 */
export default function ProjectFormModal({
  project,
  categories,
  onSubmit,
  onClose,
}: ProjectFormModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const nameRef = useRef<HTMLInputElement | null>(null)
  const urlRef = useRef<HTMLInputElement | null>(null)
  const restoreFocusRef = useRef<Element | null>(null)

  const [name, setName] = useState(project?.name ?? '')
  const [url, setUrl] = useState(project?.url ?? '')
  const [category, setCategory] = useState(project?.category ?? categories[0]?.id ?? '')
  const [featured, setFeatured] = useState(project?.featured ?? false)
  const [aspect, setAspect] = useState<Aspect>(project?.aspect ?? '16:9')
  const [errors, setErrors] = useState<Errors>({})

  const trapFocus = useCallback((event: KeyboardEvent) => {
    const panel = panelRef.current
    if (!panel) return
    const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (node) => !node.hasAttribute('disabled'),
    )
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    const active = document.activeElement

    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  // Keep the latest onClose reachable without making the mount effect depend on
  // it — a parent re-render must not re-run focus capture mid-edit.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    restoreFocusRef.current = document.activeElement
    const raf = requestAnimationFrame(() => nameRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      } else if (event.key === 'Tab') {
        trapFocus(event)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      const restore = restoreFocusRef.current
      if (restore instanceof HTMLElement) restore.focus()
    }
  }, [trapFocus])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()

    if (!trimmedName) next.name = 'A name is required.'
    if (!trimmedUrl) next.url = 'A video URL is required.'
    else if (!isHttpUrl(trimmedUrl)) next.url = 'Must be a full http:// or https:// URL.'

    setErrors(next)
    if (next.name) {
      nameRef.current?.focus()
      return
    }
    if (next.url) {
      urlRef.current?.focus()
      return
    }

    onSubmit({ name: trimmedName, url: trimmedUrl, category, featured, aspect })
    onClose()
  }

  const titleId = 'project-form-title'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/85 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-lg border border-ink-line bg-ink-raised p-5 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)] sm:p-6"
      >
        <h2 id={titleId} className="text-[12px] font-medium tracking-[0.2em] text-bone uppercase">
          {project ? 'Edit project' : 'Add project'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="pf-name" className={LABEL}>
              Name
            </label>
            <input
              ref={nameRef}
              id="pf-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${FIELD} mt-1.5`}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'pf-name-error' : undefined}
              autoComplete="off"
            />
            {errors.name && (
              <p id="pf-name-error" role="alert" className="mt-1.5 text-[11px] text-[#ff8f8f]">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pf-url" className={LABEL}>
              Video URL
            </label>
            <input
              ref={urlRef}
              id="pf-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className={`${FIELD} mt-1.5`}
              placeholder="https://res.cloudinary.com/…/video/upload/…/clip.mp4"
              aria-invalid={Boolean(errors.url)}
              aria-describedby={errors.url ? 'pf-url-error' : 'pf-url-hint'}
              autoComplete="off"
              spellCheck={false}
            />
            {errors.url ? (
              <p id="pf-url-error" role="alert" className="mt-1.5 text-[11px] text-[#ff8f8f]">
                {errors.url}
              </p>
            ) : (
              <p id="pf-url-hint" className={`${HINT} mt-1.5`}>
                The original Cloudinary .mp4 — previews and posters are derived from it.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-category" className={LABEL}>
                Category
              </label>
              <select
                id="pf-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={`${SELECT} mt-1.5`}
              >
                {categories.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
                <option value="">— Uncategorised —</option>
              </select>
            </div>

            <div>
              <label htmlFor="pf-aspect" className={LABEL}>
                Aspect
              </label>
              <select
                id="pf-aspect"
                value={aspect}
                onChange={(event) => setAspect(event.target.value as Aspect)}
                className={`${SELECT} mt-1.5`}
              >
                {ASPECTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-[13px] text-bone-dim">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="h-4 w-4 accent-[#00e5ff]"
            />
            Featured — also shown in the opening reel
          </label>

          <div className="flex flex-wrap justify-end gap-2 border-t border-ink-line pt-4">
            <button type="button" className={BTN} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={BTN_PRIMARY}>
              {project ? 'Save changes' : 'Add project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
