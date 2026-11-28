import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { MateId } from '../../data/mates.ts'
import { fetchLoginMates, liveModelsFromResponse, type LiveModel } from '../../lib/live2d/source.ts'
import { pointerGaze, type AlivingView } from '../../lib/live2d/view.ts'
import type { LiveMateRenderer } from '../../lib/live2d/renderer.ts'

type NetworkInfo = { saveData?: boolean; effectiveType?: string }

/**
 * Whether this visitor gets the live model at all. The still stays (and is the LCP) for reduced motion,
 * data saver, slow connections, low-end devices and no WebGL2. QA: `?live=0` never, `?live=1` skips the
 * device checks (reduced motion still wins).
 */
function liveAllowed(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const query = new URLSearchParams(window.location.search).get('live')
  if (query === '0') return false
  if (query !== '1') {
    const nav = navigator as Navigator & { connection?: NetworkInfo; deviceMemory?: number }
    if (nav.connection?.saveData) return false
    if (nav.connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(nav.connection.effectiveType)) return false
    if ((nav.hardwareConcurrency ?? 8) < 4) return false
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false
  }
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch { return false }
  return true
}

/** After the page has loaded and the main thread is idle, so the still stays the first and largest paint. */
function afterLoadIdle(run: () => void): () => void {
  let idle = 0
  let timer = 0
  const schedule = () => {
    if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(run, { timeout: 2500 })
    else timer = setTimeout(run, 600) as unknown as number
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
  return () => {
    window.removeEventListener('load', schedule)
    if (idle) window.cancelIdleCallback(idle)
    clearTimeout(timer)
  }
}

/** Where the model is drawn in a stage, and where its eyes are (stage px), for gaze. */
export type StageFrame = (stage: HTMLElement) => { view: AlivingView; face: { x: number; y: number } }

/**
 * The hero's live mate: API 48 (same-origin path) → Aliving2D model of the selected mate, laid exactly over its
 * still. Returns which mate is live (null: the still shows). Any failure leaves the still; nothing is retried
 * in a loop. The renderer module is loaded lazily, so the first screen's JS does not carry it.
 */
export function useLiveMate({ mateId, stage, host, active, reduced, frame: frameOf }: {
  mateId: MateId
  frame: StageFrame
  stage: RefObject<HTMLElement | null>
  host: RefObject<HTMLElement | null>
  /** In view and tab visible: draw; otherwise pause. */
  active: boolean
  reduced: boolean
}): { live: MateId | null; talk: (ms: number) => void } {
  const [models, setModels] = useState<Partial<Record<MateId, LiveModel>> | null>(null)
  const [live, setLive] = useState<MateId | null>(null)
  const renderer = useRef<LiveMateRenderer | null>(null)

  useEffect(() => {
    if (!liveAllowed()) return
    let cancelled = false
    const cancel = afterLoadIdle(() => {
      fetchLoginMates().then(body => {
        if (!cancelled) setModels(liveModelsFromResponse(body))
      }, () => { /* The still stays. */ })
    })
    return () => { cancelled = true; cancel() }
  }, [])

  const model = reduced ? undefined : models?.[mateId]
  useEffect(() => {
    const stageEl = stage.current, hostEl = host.current
    if (!model || !stageEl || !hostEl) return
    let disposed = false
    let instance: LiveMateRenderer | null = null
    let frame = 0
    let resize: ResizeObserver | null = null
    let pointer: ((event: PointerEvent) => void) | null = null
    void import('../../lib/live2d/renderer.ts').then(({ LiveMateRenderer }) => {
      if (disposed) return
      const created = new LiveMateRenderer(model, frameOf(stageEl).view)
      instance = created
      renderer.current = created
      created.subscribe(() => {
        if (created.getStatus() === 'ready') {
          // Two frames: the first drawn frame is on screen before the still fades out.
          frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => { if (!disposed) setLive(mateId) }) })
        } else if (created.getStatus() === 'error') setLive(null)
      })
      created.attach(hostEl)
      resize = new ResizeObserver(() => created.setView(frameOf(stageEl).view))
      resize.observe(stageEl)
      let pending = 0
      pointer = event => {
        if (pending) return
        pending = requestAnimationFrame(() => {
          pending = 0
          const rect = stageEl.getBoundingClientRect()
          const { face } = frameOf(stageEl)
          const gaze = pointerGaze(event.clientX - rect.left, event.clientY - rect.top, face.x, face.y, window.innerWidth, window.innerHeight)
          created.lookAt(gaze.x, gaze.y)
        })
      }
      window.addEventListener('pointermove', pointer, { passive: true })
    }, () => { /* Chunk failed to load: the still stays. */ })
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resize?.disconnect()
      if (pointer) window.removeEventListener('pointermove', pointer)
      instance?.destroy()
      if (renderer.current === instance) renderer.current = null
      setLive(null)
    }
  }, [model, mateId, stage, host, frameOf])

  useEffect(() => { renderer.current?.setPaused(!active) }, [active, live])

  const talk = useCallback((ms: number) => { renderer.current?.talk(ms) }, [])
  return { live, talk }
}
