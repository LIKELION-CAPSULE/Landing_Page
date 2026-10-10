import { useLayoutEffect, type RefObject } from 'react'

// Layout coordinates stay fixed while the scroll reveal moves a STEP's content.
function layoutTop(element: HTMLElement) {
  let top = 0
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop
  }
  return top
}

export function useStepBackground(mainRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const main = mainRef.current
    if (!main) return

    const root = document.documentElement
    const steps = [...main.querySelectorAll<HTMLElement>('.step')]
    const anchors = steps.map((step) => ({
      text: step.querySelector<HTMLElement>('.step__text')!,
      media: step.querySelector<HTMLElement>('.step__media')!,
    }))
    let frame = 0
    let disposed = false

    const update = () => {
      if (disposed) return
      const unit = Math.min(window.innerWidth, 402) / 402
      const backgrounds = anchors.flatMap(({ text, media }) => {
        const textTop = layoutTop(text)
        const textCenter = textTop + text.offsetHeight / 2
        const textRadius = text.offsetHeight * 0.6
        const mediaBottom = layoutTop(media) + media.offsetHeight
        return [
          `radial-gradient(ellipse clamp(280px, 85vw, 560px) ${textRadius}px at 50% ${textCenter}px, #000 0%, rgba(0, 0, 0, 0.88) 28%, rgba(0, 0, 0, 0.58) 52%, rgba(0, 0, 0, 0.22) 76%, transparent 100%)`,
          `radial-gradient(ellipse 60vw ${64 * unit}px at 50% ${mediaBottom + 20 * unit}px, rgba(255, 255, 255, 0.045) 0%, rgba(255, 255, 255, 0.025) 40%, transparent 100%)`,
        ]
      })
      root.style.setProperty('--step-background', backgrounds.join(', '))
    }

    const schedule = () => {
      if (disposed) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    root.classList.add('has-step-background')
    update()
    const observer = new ResizeObserver(schedule)
    observer.observe(main)
    anchors.forEach(({ text, media }) => { observer.observe(text); observer.observe(media) })
    window.addEventListener('resize', schedule)
    void document.fonts.ready.then(schedule)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      root.classList.remove('has-step-background')
      root.style.removeProperty('--step-background')
    }
  }, [mainRef])
}
