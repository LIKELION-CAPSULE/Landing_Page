import { useLayoutEffect } from 'react'

const RETIRED_PATHS = new Set(['/rooms', '/preorder', '/done', '/survey', '/test'])

// One page remains. Preserve incoming attribution and anchors without adding a history entry.
export function useRoute() {
  useLayoutEffect(() => {
    const redirect = () => {
      const path = window.location.pathname.replace(/\/+$/, '') || '/'
      if (RETIRED_PATHS.has(path)) {
        window.history.replaceState(window.history.state, '', `/${window.location.search}${window.location.hash}`)
      }
    }
    redirect()
    window.addEventListener('popstate', redirect)
    return () => window.removeEventListener('popstate', redirect)
  }, [])
}
