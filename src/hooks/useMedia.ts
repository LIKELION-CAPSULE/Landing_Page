import { useCallback, useSyncExternalStore } from 'react'

// Prerender-safe media query. The prerendered HTML and the first client render (hydration) both use
// `serverValue`, so markup never mismatches; React then re-renders with the real value after hydration.
// CSS owns the layout of both states, so this only changes behaviour, never the first paint.
export function useMedia(query: string, serverValue = false): boolean {
  const subscribe = useCallback((change: () => void) => {
    const media = window.matchMedia(query)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [query])
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue)
}

const subscribeVisibility = (change: () => void) => {
  document.addEventListener('visibilitychange', change)
  return () => document.removeEventListener('visibilitychange', change)
}

// Tab visibility, prerender-safe (the prerendered page counts as visible).
export function useTabVisible(): boolean {
  return useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true)
}

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
