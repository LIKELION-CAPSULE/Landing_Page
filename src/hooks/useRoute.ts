import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

export const ROUTES = {
  home: '/',
  rooms: '/rooms',
  survey: '/survey',
  preorder: '/preorder',
  done: '/done',
} as const

type Direction = 'forward' | 'back'
type HistoryState = { idx: number; scrollY: number }

// Swap pages inside a view transition so the next page slides over the
// current one like a native push. `data-nav` picks the direction in CSS.
function transition(direction: Direction, update: () => void) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    update()
    return
  }
  const root = document.documentElement
  root.dataset.nav = direction
  document.startViewTransition(update).finished.finally(() => {
    delete root.dataset.nav
  })
}

// Minimal pushState router: two pages don't warrant a routing library.
export function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname)
  const idxRef = useRef<number>((window.history.state as HistoryState | null)?.idx ?? 0)
  // Set by restart(): the next pop lands on home, at the top.
  const restartRef = useRef(false)

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    if (!window.history.state) {
      window.history.replaceState({ idx: 0, scrollY: 0 } satisfies HistoryState, '')
    }

    const onPopState = (event: PopStateEvent) => {
      const state = event.state as HistoryState | null
      const idx = state?.idx ?? 0
      const direction: Direction = idx < idxRef.current ? 'back' : 'forward'
      idxRef.current = idx

      const restarting = restartRef.current
      restartRef.current = false
      // The first entry may not be home if the visit began deeper in.
      if (restarting && window.location.pathname !== ROUTES.home) {
        window.history.replaceState({ idx, scrollY: 0 } satisfies HistoryState, '', ROUTES.home)
      }

      transition(direction, () => {
        flushSync(() => setPath(window.location.pathname))
        window.scrollTo(0, restarting ? 0 : state?.scrollY ?? 0)
      })
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((to: string) => {
    // Remember where we left so coming back lands on the same spot.
    window.history.replaceState({ idx: idxRef.current, scrollY: window.scrollY } satisfies HistoryState, '')
    idxRef.current += 1
    window.history.pushState({ idx: idxRef.current, scrollY: 0 } satisfies HistoryState, '', to)

    transition('forward', () => {
      flushSync(() => setPath(to))
      window.scrollTo(0, 0)
    })
  }, [])

  // Prefer a real history pop so the previous page's scroll comes back.
  // Opened directly (nothing to pop)? Slide back to `fallback` in place instead.
  const goBack = useCallback((fallback: string = ROUTES.home) => {
    if (idxRef.current > 0) {
      window.history.back()
      return
    }
    window.history.replaceState({ idx: 0, scrollY: 0 } satisfies HistoryState, '', fallback)
    transition('back', () => {
      flushSync(() => setPath(fallback))
      window.scrollTo(0, 0)
    })
  }, [])

  // Back to the very start: rewind history rather than pushing, so the
  // browser's back button doesn't return to the finished flow.
  const restart = useCallback(() => {
    if (idxRef.current > 0) {
      restartRef.current = true
      window.history.go(-idxRef.current)
      return
    }
    window.history.replaceState({ idx: 0, scrollY: 0 } satisfies HistoryState, '', ROUTES.home)
    transition('back', () => {
      flushSync(() => setPath(ROUTES.home))
      window.scrollTo(0, 0)
    })
  }, [])

  return { path, navigate, goBack, restart }
}
