import { useEffect, useRef, useState } from 'react'
import './not-found.css'

// 「4 · broken capsule · 4」. The digits are page text; the capsule and the glass are a three.js scene
// (three/broken-capsule-scene.ts, loaded only here, after mount) drawn on a transparent canvas over them. Before it
// is ready, and whenever it cannot run, a still image of the very same frame stands in its place.
// Decoration only (aria-hidden): the page says what happened in words.

export type NotFoundSceneProps = {
  /** Whether the realtime scene may run (reduced motion, low-end devices, data saver: no). Asked once, after mount. */
  canAnimate: () => boolean
  /** The still image of the scene (same frame as the live one starts from), 1x and 2x of the 1760 × 540 stage. */
  still?: { src: string; srcSet: string }
  /** Still image generation: draw one fixed frame and expose it (development only). */
  capture?: boolean
}

export default function NotFoundScene({ canAnimate, still, capture = false }: NotFoundSceneProps) {
  const scene = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const element = scene.current, canvasHost = host.current
    if (!element || !canvasHost || (!capture && !canAnimate())) return
    let disposed = false
    let controller: { setRunning(value: boolean): void; dispose(): void; canvas: HTMLCanvasElement } | null = null
    let inView = true
    const update = () => controller?.setRunning(inView && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { inView = Boolean(entry?.isIntersecting); update() })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    void import('./three/broken-capsule-scene.ts').then(({ createBrokenCapsuleScene }) => {
      if (disposed) return
      try {
        controller = createBrokenCapsuleScene({
          host: canvasHost,
          pointerTarget: document.documentElement,
          still: capture,
          onFirstFrame: () => {
            if (disposed) return
            setLive(true)
            if (capture) (window as unknown as { __notFoundStill?: () => string }).__notFoundStill = () => controller!.canvas.toDataURL('image/webp', 0.92)
          },
          onContextFailure: () => setLive(false),
        })
        update()
      } catch {
        // No WebGL: the still image stays.
      }
    }, () => { /* The chunk did not load: the still image stays. */ })
    return () => {
      disposed = true
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
      controller?.dispose()
    }
  }, [canAnimate, capture])

  return (
    <div ref={scene} className="nf-scene" data-live={live || undefined} data-capture={capture || undefined} aria-hidden="true">
      <div className="nf-number"><span>4</span><span className="nf-gap" /><span>4</span></div>
      {still && !capture && <img className="nf-still" src={still.src} srcSet={still.srcSet} sizes="(max-width: 928px) calc(200vw - 96px), 1760px" width="1760" height="540" alt="" fetchPriority="high" decoding="async" draggable={false} />}
      <div ref={host} className="nf-canvas" />
    </div>
  )
}
