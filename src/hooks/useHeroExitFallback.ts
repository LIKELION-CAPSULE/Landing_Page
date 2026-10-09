import { useEffect, type RefObject } from 'react'

// Hero exit fallback for browsers without CSS scroll-driven animations.
// Mirrors the `hero-exit` keyframes in styles.css.
export function useHeroExitFallback(
  innerRef: RefObject<HTMLElement | null>,
  hintRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (CSS.supports('animation-timeline: scroll()')) return

    const inner = innerRef.current
    const hint = hintRef.current
    if (!inner || !hint) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const update = () => {
      frame = 0
      const p = Math.min(Math.max(window.scrollY / window.innerHeight, 0), 1)
      inner.style.opacity = String(1 - 0.9 * p)
      inner.style.transform = reduceMotion.matches
        ? 'none'
        : `translateY(${30 * p}%) scale(${1 - 0.06 * p})`
      hint.style.opacity = String(1 - Math.min(p / 0.2, 1))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [innerRef, hintRef])
}
