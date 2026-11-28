import { useEffect, useRef, useState } from 'react'
import type { DemoView } from '../demo/useDemoClips.ts'
import { REDUCED_MOTION_QUERY, useMedia, useTabVisible } from '../../hooks/useMedia.ts'

export function useMomentScene(duration: number, stillTime: number) {
  const frame = useRef<HTMLDivElement>(null), elapsed = useRef(0)
  const [time, setTime] = useState(0), [visible, setVisible] = useState(false), [near, setNear] = useState(false)
  const [paused, setPaused] = useState(false), tabVisible = useTabVisible()
  const reduced = useMedia(REDUCED_MOTION_QUERY)
  const active = visible && tabVisible && !paused && !reduced
  useEffect(() => {
    const element = frame.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.intersectionRatio >= .5), { threshold: [0, .5, 1] })
    const warm = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNear(true); warm.disconnect() } }, { rootMargin: '600px 0px' })
    observer.observe(element); warm.observe(element)
    return () => { observer.disconnect(); warm.disconnect() }
  }, [])
  useEffect(() => {
    if (!active) return
    let raf = 0, previous = performance.now(), bucket = -1
    const tick = (now: number) => {
      elapsed.current = (elapsed.current + now - previous) % duration; previous = now
      const next = Math.floor(elapsed.current / 33)
      if (next !== bucket) { bucket = next; setTime(elapsed.current) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, duration])
  return { frame, time: reduced ? stillTime : time, elapsed, near, visible, active, paused, reduced, toggle: () => setPaused(value => !value) }
}

// Same decision as S3: measure the media frame, never the viewport aspect.
export function useMomentFrame() {
  const frame = useRef<HTMLDivElement>(null), [view, setView] = useState<DemoView | null>(null)
  useEffect(() => {
    const element = frame.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => { const { width, height } = entry.contentRect; if (width && height) setView(width / height > 1 ? 'wide' : 'tall') })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return { frame, view }
}
