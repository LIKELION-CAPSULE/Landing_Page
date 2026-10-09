import { useEffect, type RefObject } from 'react'

// Reveal [data-reveal] blocks once as they enter. Siblings that enter
// together are staggered by 60ms so they don't all land at once.
export function useReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const revealables = root.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      revealables.forEach((el) => el.setAttribute('data-visible', ''))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, index) => {
          const el = entry.target as HTMLElement
          el.style.setProperty('--reveal-delay', `${index * 60}ms`)
          el.setAttribute('data-visible', '')
          observer.unobserve(el)
        })
    }, { rootMargin: '0px 0px -12% 0px' })

    revealables.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [rootRef])
}
