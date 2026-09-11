import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef } from 'react'
import { EASE_OUT_CUBIC } from '../../lib/motion'
import { fullVideoUrl, posterUrl } from '../../lib/cloudinary'
import { ASPECT_RATIO } from '../../types'
import type { Project } from '../../types'

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
  /** Step to an adjacent project with ← / →; omit to disable. */
  onStep?: (delta: number) => void
}

/**
 * Full-screen lightbox: the original Cloudinary asset, unmuted, with a real
 * focus trap and ESC / backdrop dismissal.
 */
export default function ProjectModal({ project, onClose, onStep }: ProjectModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const restoreFocusRef = useRef<Element | null>(null)
  const open = project !== null

  const trapFocus = useCallback((event: KeyboardEvent) => {
    const panel = panelRef.current
    if (!panel) return
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], video[controls], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement
    // Defer so the panel exists before we move focus into it.
    const raf = requestAnimationFrame(() => closeRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'Tab') {
        trapFocus(event)
      } else if (onStep && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault()
        onStep(event.key === 'ArrowRight' ? 1 : -1)
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
  }, [open, onClose, onStep, trapFocus])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_CUBIC }}
          role="dialog"
          aria-modal="true"
          aria-label={project.name}
        >
          {/* Backdrop — clicking anywhere off the panel dismisses. */}
          <button
            type="button"
            aria-label="Close video"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/92 backdrop-blur-md"
          />

          <motion.div
            ref={panelRef}
            className="relative z-10 flex w-full max-w-[min(1400px,92vw)] flex-col items-center gap-5"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.55, ease: EASE_OUT_CUBIC }}
          >
            <div
              className="w-full overflow-hidden rounded-sm bg-black shadow-[0_40px_120px_-40px_rgba(0,0,0,1)]"
              style={{
                aspectRatio: ASPECT_RATIO[project.aspect],
                maxHeight: '82vh',
                // 9:16 clips would otherwise stretch to the full 1400px frame.
                margin: '0 auto',
                width: project.aspect === '9:16' ? 'min(100%, 46vh)' : '100%',
              }}
            >
              {/* Remounted per project id so switching clips restarts playback. */}
              <video
                key={project.id}
                src={fullVideoUrl(project.url)}
                poster={posterUrl(project.url, 1280)}
                autoPlay
                loop
                controls
                playsInline
                preload="auto"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex w-full items-center justify-between gap-6">
              <h2 className="display-type text-xl text-bone sm:text-2xl">{project.name}</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-ink-line px-4 py-2 text-[11px] tracking-[0.25em] text-bone-dim uppercase transition-colors duration-300 hover:border-accent hover:text-accent"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
