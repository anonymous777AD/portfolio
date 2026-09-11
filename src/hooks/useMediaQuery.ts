import { useCallback, useSyncExternalStore } from 'react'

function matches(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(query).matches
}

/**
 * Subscribes to a media query.
 *
 * `useSyncExternalStore` rather than state-plus-effect: the browser's match
 * list is an external store, and reading it through this hook means there is
 * no window between first render and the effect in which the component holds a
 * stale answer — which is exactly what a reduced-motion check must not do,
 * since the first frame is the one that would animate.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => undefined
      }
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => matches(query),
    // Server snapshot: assume no preference rather than guessing a device.
    () => false,
  )
}
