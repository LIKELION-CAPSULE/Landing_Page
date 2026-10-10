import { useLayoutEffect, type RefObject } from 'react'

// In-app browser controls can leave less visible space than the hero's design height.
// Move only the hint, keeping the model framing and scroll timeline stable.
export function useHeroVisibleViewport(sectionRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const viewport = window.visualViewport
    let frame = 0
    const update = () => {
      frame = 0
      const bottom = Math.min(window.innerHeight, (viewport?.height ?? window.innerHeight) + (viewport?.offsetTop ?? 0))
      section.style.setProperty('--macbook-visible-bottom', `${Math.floor(bottom)}px`)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('resize', schedule)
    viewport?.addEventListener('resize', schedule)
    viewport?.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      viewport?.removeEventListener('resize', schedule)
      viewport?.removeEventListener('scroll', schedule)
      section.style.removeProperty('--macbook-visible-bottom')
    }
  }, [sectionRef])
}
