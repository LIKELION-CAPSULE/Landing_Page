import { useLayoutEffect, useState, type RefObject } from 'react'
import gsap from 'gsap'
import type { MacbookLoadStatus } from './macbook-config.ts'

function elementsInScreenOrder(section: HTMLElement) {
  return [...section.querySelectorAll<HTMLElement>('[data-intro-item]')]
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
}

export function useMacbookIntro(
  sectionRef: RefObject<HTMLElement | null>,
  typingComplete: boolean,
  status: MacbookLoadStatus,
  reducedMotion: boolean,
  cycle: number,
) {
  const [complete, setComplete] = useState(reducedMotion)
  const [titleReady, setTitleReady] = useState(reducedMotion)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    setComplete(reducedMotion)
    setTitleReady(reducedMotion)
    const context = gsap.context(() => {
      const elements = elementsInScreenOrder(section)
      if (reducedMotion) {
        gsap.set(elements, { autoAlpha: 1, y: 0 })
        return
      }
      gsap.set(elements, { autoAlpha: 0, y: 12 })
      const logo = elements.find(element => element.dataset.introItem === 'logo')
      if (logo) gsap.to(logo, {
        autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out',
        onComplete: () => setTitleReady(true),
      })
    }, section)
    return () => context.revert()
  }, [sectionRef, reducedMotion, cycle])

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section || reducedMotion || !typingComplete || status !== 'ready') return
    const context = gsap.context(() => {
      // The model's 0.8s entrance precedes the scroll hint and model credit.
      const elements = elementsInScreenOrder(section).filter(element => element.dataset.introItem !== 'logo')
      const timeline = gsap.timeline({ delay: 0.85, onComplete: () => setComplete(true) })
      elements.forEach((element, index) => {
        timeline.to(element, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, index * 0.22)
      })
    }, section)
    return () => context.revert()
  }, [sectionRef, typingComplete, status, reducedMotion, cycle])

  return { complete, titleReady }
}
