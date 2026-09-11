import { useMediaQuery } from './useMediaQuery'

/**
 * Tracks the OS "reduce motion" setting and keeps up with live changes.
 * Every ambient animation on the site — 3D auto-rotate, parallax, ken-burns,
 * card tilt, smooth scroll — is gated on this returning false.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
