import { useCallback, useEffect, useRef, useState } from 'react'

// Share downloaded/decoded portraits across the three demonstrations.
const imageReadiness = new Map<string, Promise<boolean>>()
function prepareImage(src: string) {
  const cached = imageReadiness.get(src)
  if (cached) return cached
  const image = new Image()
  image.src = src
  const promise = image.decode().then(() => true, () => {
    imageReadiness.delete(src)
    return false
  })
  imageReadiness.set(src, promise)
  return promise
}

// A single explanatory pass, with a clock that pauses outside the viewport
// or in a background tab. No frame-by-frame React updates are needed.
export function useDemoPlayback(durations: readonly number[], phaseImages: readonly (readonly string[])[]) {
  const ref = useRef<HTMLDivElement>(null)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [phase, setPhase] = useState(() => reduced ? durations.length - 1 : 0)
  const [requestedPhase, setRequestedPhase] = useState(phase)
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined')
  const [tabVisible, setTabVisible] = useState(() => !document.hidden)
  const [decorationsReady, setDecorationsReady] = useState(false)
  const [prepared, setPrepared] = useState(() => ({ loaded: new Set<string>(), settled: new Set<string>() }))
  const started = useRef(reduced)
  const currentPhase = useRef(phase)
  const requestedPhaseRef = useRef(phase)
  const generation = useRef(0)
  const remaining = useRef(durations[phase])

  const requestPhase = useCallback((next: number) => {
    generation.current += 1
    requestedPhaseRef.current = next
    remaining.current = durations[next]
    setRequestedPhase(next)
  }, [durations])

  const jump = useCallback((next: number) => {
    started.current = true
    setNear(true)
    setPlaying(false)
    requestPhase(next)
  }, [requestPhase])

  const ready = decorationsReady && phaseImages[phase].every(src => prepared.settled.has(src))
  const requestedReady = decorationsReady && phaseImages[requestedPhase].every(src => prepared.settled.has(src))
  const pending = requestedPhase !== phase

  useEffect(() => {
    const target = ref.current
    if (!target || !near) return
    let mounted = true
    void Promise.allSettled([...target.querySelectorAll('img')].map(image => image.decode())).then(() => {
      if (mounted) setDecorationsReady(true)
    })
    return () => { mounted = false }
  }, [near])

  // Only prepare the current phase and one visible-phase lookahead. Failed
  // downloads leave the existing portrait in place and do not trap controls.
  useEffect(() => {
    if (!near || !tabVisible) return
    let mounted = true
    const prepare = (sources: readonly string[]) => {
      void Promise.all(sources.map(async src => ({ src, loaded: await prepareImage(src) }))).then(results => {
        if (!mounted) return
        setPrepared(previous => {
          if (results.every(({ src, loaded }) => previous.settled.has(src) && (!loaded || previous.loaded.has(src)))) return previous
          const loaded = new Set(previous.loaded)
          const settled = new Set(previous.settled)
          for (const result of results) {
            settled.add(result.src)
            if (result.loaded) loaded.add(result.src)
          }
          return { loaded, settled }
        })
      })
    }
    prepare(phaseImages[requestedPhase])
    if (visible && !reduced && !pending && requestedPhase < durations.length - 1) prepare(phaseImages[requestedPhase + 1])
    return () => { mounted = false }
  }, [near, tabVisible, visible, reduced, pending, requestedPhase, phaseImages, durations])

  useEffect(() => {
    if (!pending || !requestedReady || (playing && (!visible || !tabVisible))) return
    // Mount decoded incoming layers at opacity 0 before changing their state.
    // This gives CSS a painted starting frame, including a cold manual jump.
    let secondFrame = 0
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        currentPhase.current = requestedPhase
        setPhase(requestedPhase)
      })
    })
    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  }, [pending, requestedReady, requestedPhase, playing, visible, tabVisible])

  useEffect(() => {
    const target = ref.current
    if (!target) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => {
      setReduced(media.matches)
      if (media.matches) {
        started.current = true
        setPlaying(false)
        requestPhase(durations.length - 1)
      }
    }
    const onVisibility = () => setTabVisible(!document.hidden)
    media.addEventListener('change', onMotion)
    document.addEventListener('visibilitychange', onVisibility)
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.4)
    }, { threshold: [0, 0.4] })
    const preparationObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNear(true)
    }, { rootMargin: '300px' })
    if (observer) observer.observe(target)
    if (preparationObserver) preparationObserver.observe(target)
    return () => {
      observer?.disconnect()
      preparationObserver?.disconnect()
      media.removeEventListener('change', onMotion)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [durations, requestPhase])

  const running = playing && visible && tabVisible && ready && !pending && !reduced
  useEffect(() => {
    if (!visible || !tabVisible || !ready || reduced || started.current) return
    started.current = true
    setPlaying(true)
  }, [visible, tabVisible, ready, reduced])

  useEffect(() => {
    if (!running) return
    const pass = generation.current
    const start = performance.now()
    const time = remaining.current
    const timer = window.setTimeout(() => {
      if (phase === durations.length - 1) {
        setPlaying(false)
      } else {
        requestPhase(phase + 1)
      }
    }, time)
    return () => {
      window.clearTimeout(timer)
      if (generation.current === pass && currentPhase.current === phase) {
        remaining.current = Math.max(0, time - (performance.now() - start))
      }
    }
  }, [running, phase, durations, requestPhase])

  const advance = () => jump((requestedPhaseRef.current + 1) % durations.length)

  const toggle = () => {
    started.current = true
    setNear(true)
    if (reduced) {
      advance()
    } else if (playing) {
      setPlaying(false)
    } else {
      if (phase === durations.length - 1) {
        requestPhase(0)
      }
      setPlaying(true)
    }
  }

  return { ref, phase, playing, running, reduced, pending, loadedImages: prepared.loaded, advance, toggle }
}
