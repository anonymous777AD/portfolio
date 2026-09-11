import { useAutoplayOnVisible } from '../../hooks/useAutoplayOnVisible'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { posterUrl, previewVideoUrl } from '../../lib/cloudinary'
import { ASPECT_RATIO } from '../../types'
import type { Project } from '../../types'

interface VideoSurfaceProps {
  project: Project
  /** Width passed to Cloudinary for the preview rendition. */
  previewWidth?: number
  /** Slow ken-burns push-in while the clip is on screen. */
  kenBurns?: boolean
  /** Extra classes for the clipping frame. */
  className?: string
  /** Forces playback off — used while the lightbox has focus. */
  paused?: boolean
}

/**
 * The muted, looping preview surface used by every card on the homepage.
 * Bandwidth discipline lives here: a downscaled Cloudinary rendition, a still
 * poster so nothing paints black, `preload="metadata"`, and playback strictly
 * gated on 50% visibility.
 */
export default function VideoSurface({
  project,
  previewWidth = 720,
  kenBurns = false,
  className = '',
  paused = false,
}: VideoSurfaceProps) {
  const reducedMotion = usePrefersReducedMotion()
  const { ref, visible } = useAutoplayOnVisible({ threshold: 0.5, enabled: !paused })
  const zooming = kenBurns && visible && !reducedMotion

  return (
    <div
      className={`relative overflow-hidden bg-ink-raised ${className}`}
      style={{ aspectRatio: ASPECT_RATIO[project.aspect] }}
    >
      <video
        ref={ref}
        src={previewVideoUrl(project.url, previewWidth)}
        poster={posterUrl(project.url, previewWidth)}
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-label={project.name}
        className="h-full w-full object-cover"
        style={{
          transform: zooming ? 'scale(1.08)' : 'scale(1)',
          transition: reducedMotion ? 'none' : 'transform 9s cubic-bezier(0.33, 1, 0.68, 1)',
        }}
      />
    </div>
  )
}
