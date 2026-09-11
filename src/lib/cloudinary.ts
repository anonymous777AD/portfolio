/**
 * Cloudinary delivery-URL helpers.
 *
 * A Cloudinary video URL looks like:
 *   https://res.cloudinary.com/<cloud>/video/upload/<transforms?>/<version>/<public_id>.mp4
 *
 * We inject a transformation segment right after `/upload/` so grids can pull
 * small, cheap previews while the modal pulls the full-resolution asset.
 */

const UPLOAD_SEGMENT = '/upload/'

function isCloudinary(url: string): boolean {
  return url.includes('res.cloudinary.com') && url.includes(UPLOAD_SEGMENT)
}

/** Insert (or replace nothing — we never clobber existing transforms) a transform segment. */
function withTransform(url: string, transform: string): string {
  if (!isCloudinary(url) || !transform) return url
  const i = url.indexOf(UPLOAD_SEGMENT)
  const head = url.slice(0, i + UPLOAD_SEGMENT.length)
  const tail = url.slice(i + UPLOAD_SEGMENT.length)
  // Don't stack transforms if one is already present (segment before the version).
  if (/^[a-z]{1,3}_[^/]+\//.test(tail)) return url
  return `${head}${transform}/${tail}`
}

/** Low-bandwidth looping preview used inside grid/section cards. */
export function previewVideoUrl(url: string, width = 720): string {
  return withTransform(url, `q_auto:eco,f_auto,vc_auto,w_${width}`)
}

/** Full-resolution source used when a project opens in the modal. */
export function fullVideoUrl(url: string): string {
  return url
}

/**
 * A single still frame, used as the `poster` so a card paints instantly
 * instead of showing a black box while metadata loads.
 */
export function posterUrl(url: string, width = 720): string {
  if (!isCloudinary(url)) return ''
  const jpg = url.replace(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, '.jpg')
  return withTransform(jpg, `q_auto,f_auto,w_${width},so_0`)
}
