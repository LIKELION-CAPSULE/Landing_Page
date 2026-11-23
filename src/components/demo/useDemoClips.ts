import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CHAERIN_DEMO, type DemoId } from '../../data/chaerin-demo.ts'
import { requestDemoClip, retainDemoClips } from './demoClipCache.ts'

const files = import.meta.glob<string>('../../assets/mates/chaerin/demo/*.{webm,mp4,webp}', { eager: true, query: '?url', import: 'default' })
const asset = (name: string) => files[`../../assets/mates/chaerin/demo/${name}`]
export const demoStill = (view: string, id: DemoId, turned: boolean) => asset(`demo-${id}-${view}${turned ? '-then' : ''}-call.webp`)
export const demoPoster = (view: string) => asset(`demo-idle-${view}-poster.webp`)
type Slot = { key: string; clip: string; blob: string }
export type DemoView = 'wide' | 'tall'
type Options = { near: boolean; inView: boolean; active: boolean; reduced: boolean; frameView: DemoView | null; target: DemoId | 'idle'; time: () => number; preload?: readonly DemoId[] }
const defaultPreload = CHAERIN_DEMO.map(item => item.id)

// Two persistent native players share downloaded blobs. Only the selected view
// and browser-supported codec are fetched; importing asset URLs does not fetch.
export function useDemoClips(options: Options) {
  const { near, inView, active, reduced, frameView, target } = options
  const [selection, setSelection] = useState<{ view: DemoView; clip: DemoId | 'idle' } | null>(null)
  // ResizeObserver supplies the real frame shape. Latch it at clip boundaries,
  // so resizing never replaces a reaction in progress. A still idle can update
  // immediately; an animated idle changes at its next loop or reaction.
  if (frameView && (!selection || selection.clip !== target || (reduced && target === 'idle' && selection.view !== frameView))) setSelection({ view: frameView, clip: target })
  const view = selection?.view ?? null
  const clip = selection?.clip ?? target
  const [codec, setCodec] = useState(() => document.createElement('video').canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4')
  const videos = useRef<(HTMLVideoElement | null)[]>([null, null])
  const [slots, setSlots] = useState<(Slot | null)[]>([null, null])
  const [front, setFront] = useState<number | null>(null)
  const frontRef = useRef<number | null>(null)
  const pending = useRef<{ index: number; key: string; prepared: boolean; committed: boolean } | null>(null)
  const [renderedKey, setRenderedKey] = useState('')
  const current = useRef(options)
  useLayoutEffect(() => { current.current = options }, [options])
  const key = `${view}:${codec}:${clip}`
  const idleTime = useRef({ key: '', time: 0 })

  const request = useCallback((clip: string) => {
    if (!view) return Promise.reject(new Error('Demo frame not measured'))
    const id = `${view}:${codec}:${clip}`
    const url = asset(`demo-${clip}-${view}.${codec}`)
    if (!url) return Promise.reject(new Error(`Missing demo clip ${id}`))
    return requestDemoClip(url)
  }, [view, codec])

  useEffect(retainDemoClips, [])

  useEffect(() => {
    if (near && view && !reduced) void request('idle').catch(() => {})
  }, [near, view, reduced, request])
  useEffect(() => {
    if (inView && view && !reduced) (options.preload ?? defaultPreload).forEach(id => { void request(id).catch(() => {}) })
  }, [inView, view, reduced, request, options.preload])

  const prepare = useCallback((index: number) => {
    const job = pending.current, video = videos.current[index]
    if (!job || job.index !== index || job.committed || !video || video.readyState < 2) return
    if (!job.prepared) {
      job.prepared = true
      const targetTime = current.current.target === 'idle' ? 0 : current.current.time() / 1000
      const seek = Math.min(targetTime, Math.max(0, video.duration - 1 / 24))
      if (Math.abs(video.currentTime - seek) > .015) { video.currentTime = seek; return }
    }
    if (video.seeking) return
    const commit = () => {
      if (pending.current !== job || job.committed) return
      job.committed = true
      const old = frontRef.current
      if (old !== null && old !== index) videos.current[old]?.pause()
      frontRef.current = index
      setFront(index)
      setRenderedKey(job.key)
      if (current.current.active) void video.play().catch(() => {})
    }
    // HAVE_CURRENT_DATA is the decoded first frame; rVFC confirms compositor
    // delivery where available. Paused preloads also get a decoded-frame fallback.
    if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(commit)
    window.setTimeout(commit, 80)
    if (current.current.active) void video.play().catch(() => {})
  }, [])

  useEffect(() => {
    if (!near || !view || reduced) return
    let cancelled = false
    void request(clip).then(blob => {
      if (cancelled) return
      const index = frontRef.current === 0 ? 1 : 0
      pending.current = { index, key, prepared: false, committed: false }
      setSlots(previous => previous.map((slot, i) => i === index ? { key, clip, blob } : slot))
      requestAnimationFrame(() => prepare(index))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [near, view, reduced, clip, key, request, prepare])

  useEffect(() => {
    videos.current.forEach((video, index) => {
      if (!video) return
      if (active && !reduced && index === frontRef.current) void video.play().catch(() => {})
      else video.pause()
    })
  }, [active, reduced, front])

  const onTimeUpdate = (index: number) => {
    const video = videos.current[index]
    if (!video || index !== frontRef.current || target !== 'idle' || slots[index]?.clip !== 'idle') return
    const previous = idleTime.current
    if (previous.key === renderedKey && video.currentTime + .5 < previous.time && frameView && frameView !== view) setSelection({ view: frameView, clip: 'idle' })
    idleTime.current = { key: renderedKey, time: video.currentTime }
  }
  // The matching poster stays beneath both players, including load failures.
  const onError = () => { if (codec === 'webm') setCodec('mp4') }
  return {
    videos, slots, front, prepare, onError, onTimeUpdate,
    poster: near && view ? asset(`demo-idle-${view}-poster.webp`) : undefined,
    fallback: target !== 'idle' && renderedKey !== key,
    renderedKey, view, codec,
  }
}
