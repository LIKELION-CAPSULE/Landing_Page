import { useLayoutEffect, type RefObject } from 'react'

const DARK_GRADIENT_SCALE = 1.5625
const WHITE_GRADIENT_SCALE = 1.2
const WHITE_GRADIENT_OPACITY = 0.1

// Layout coordinates stay fixed while the scroll reveal moves a STEP's content.
function layoutTop(element: HTMLElement) {
  let top = 0
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop
  }
  return top
}

// Ease opacity in and out with no flat bands or abrupt changes in slope.
function smoothGradient(rgb: string, start: number, peak: number, end: number, opacity: number) {
  const segments = 16
  const stops = Array.from({ length: segments * 2 + 1 }, (_, index) => {
    const rising = index <= segments
    const progress = (rising ? index : index - segments) / segments
    const position = rising ? start + (peak - start) * progress : peak + (end - peak) * progress
    const strength = (1 + (rising ? -1 : 1) * Math.cos(Math.PI * progress)) / 2
    return `rgba(${rgb}, ${(opacity * strength).toFixed(4)}) ${position.toFixed(2)}px`
  })
  return `linear-gradient(to bottom, ${stops.join(', ')})`
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
        const textBottom = textTop + text.offsetHeight
        const mediaTop = layoutTop(media)
        const mediaHeight = media.offsetHeight
        const mediaBottom = mediaTop + mediaHeight
        const darkPeak = textBottom + (mediaTop - textBottom) / 2
        const darkStart = darkPeak - (darkPeak - textTop) * DARK_GRADIENT_SCALE
        const darkEnd = darkPeak + (mediaTop + mediaHeight * 0.5 - darkPeak) * DARK_GRADIENT_SCALE
        const whitePeak = mediaTop + mediaHeight * 0.8
        const whiteStart = whitePeak - mediaHeight * 0.3 * WHITE_GRADIENT_SCALE
        const whiteEnd = whitePeak + (mediaBottom + 56 * unit - whitePeak) * WHITE_GRADIENT_SCALE
        return [
          // Scale both fades around the same peak while keeping the smooth curve.
          smoothGradient('0, 0, 0', darkStart, darkPeak, darkEnd, 0.92),
          // Widen the subtle glow around the demo's lower half and blend out below it.
          smoothGradient('255, 255, 255', whiteStart, whitePeak, whiteEnd, WHITE_GRADIENT_OPACITY),
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
