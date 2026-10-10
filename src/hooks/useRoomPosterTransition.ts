import { useCallback, useEffect, useRef } from 'react'
import { useAnimatedDialog } from './useAnimatedDialog.ts'

type Flight = { source: HTMLElement; visibility: string; animations: Animation[] }

function transformBetween(from: DOMRect, to: DOMRect) {
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`
}

function imageCrop(source: HTMLElement, target: DOMRect) {
  const box = source.getBoundingClientRect()
  const image = source.querySelector('img')?.getBoundingClientRect()
  if (!image) return 'none'
  return `translate(${(image.left - box.left) / box.width * target.width}px, ${(image.top - box.top) / box.height * target.height}px) scale(${image.width / box.width}, ${image.height / box.height})`
}

// Animate only the live poster between its two rectangles. The native
// dialog retains focus management; the page never enters a View Transition.
export function useRoomPosterTransition() {
  const { ref, open: showModal, close: fadeClose } = useAnimatedDialog()
  const sourceRef = useRef<HTMLElement | null>(null)
  const flightRef = useRef<Flight | null>(null)
  const generation = useRef(0)

  const cancelFlight = useCallback(() => {
    generation.current += 1
    const flight = flightRef.current
    flightRef.current = null
    if (!flight) return
    flight.animations.forEach(animation => animation.cancel())
    flight.source.style.visibility = flight.visibility
  }, [])

  useEffect(() => () => cancelFlight(), [cancelFlight])

  const open = useCallback((source: HTMLElement) => {
    const sheet = ref.current
    if (!sheet || sheet.open) return
    sourceRef.current = source
    // Safari pointer activation doesn't focus buttons. Restore focus to the
    // poster on close, and focus the card on open instead of the close control.
    source.focus({ preventScroll: true })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !sheet.animate) {
      showModal()
      return
    }
    const from = source.getBoundingClientRect()
    sheet.dataset.posterTransition = 'opening'
    showModal()
    sheet.scrollTop = 0
    const art = sheet.querySelector<HTMLElement>('.room-sheet__art')
    if (!art) {
      delete sheet.dataset.posterTransition
      return
    }
    const target = art.getBoundingClientRect()
    const image = art.querySelector('img')
    const fade = art.querySelector<HTMLElement>('.room-sheet__fade')
    const pass = ++generation.current
    const visibility = source.style.visibility
    source.style.visibility = 'hidden'
    const animation = art.animate([{ transform: transformBetween(from, target) }, { transform: 'none' }], {
      duration: 280, easing: getComputedStyle(sheet).getPropertyValue('--ease-in-out').trim(), fill: 'both',
    })
    const crop = image?.animate([{ transform: imageCrop(source, target), opacity: 1 }, { transform: 'none', opacity: 0.8 }], {
      duration: 280, easing: getComputedStyle(sheet).getPropertyValue('--ease-in-out').trim(), fill: 'both',
    })
    // Finish the poster's gradient before revealing the attached footer.
    const blend = fade?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 280, easing: getComputedStyle(sheet).getPropertyValue('--ease-in-out').trim(), fill: 'both',
    })
    flightRef.current = { source, visibility, animations: [animation, crop, blend].filter((track): track is Animation => !!track) }
    void animation.finished.then(() => {
      if (generation.current !== pass) return
      cancelFlight()
      delete sheet.dataset.posterTransition
    }).catch(() => {})
  }, [ref, showModal, cancelFlight])

  const close = useCallback(() => {
    const sheet = ref.current
    const art = sheet?.querySelector<HTMLElement>('.room-sheet__art')
    const source = sourceRef.current
    if (!sheet?.open || sheet.dataset.closing !== undefined) return
    const current = art?.getBoundingClientRect()
    const image = art?.querySelector('img')
    const imageStyle = image ? getComputedStyle(image) : null
    const imageTransform = imageStyle?.transform ?? 'none'
    const imageOpacity = imageStyle?.opacity ?? '0.8'
    const fade = art?.querySelector<HTMLElement>('.room-sheet__fade')
    const fadeOpacity = fade ? getComputedStyle(fade).opacity : '1'
    cancelFlight()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!art || !current || !source?.isConnected || reduced || !art.animate) {
      delete sheet.dataset.posterTransition
      fadeClose()
      return
    }
    const to = source.getBoundingClientRect()
    if (to.bottom < 0 || to.top > window.innerHeight || !to.width) {
      delete sheet.dataset.posterTransition
      fadeClose()
      return
    }
    sheet.dataset.posterTransition = 'closing'
    sheet.dataset.closing = ''
    sheet.scrollTop = 0
    const base = art.getBoundingClientRect()
    const pass = ++generation.current
    const visibility = source.style.visibility
    source.style.visibility = 'hidden'
    const animation = art.animate([{ transform: transformBetween(current, base) }, { transform: transformBetween(to, base) }], {
      duration: 200, easing: getComputedStyle(sheet).getPropertyValue('--ease-in-out').trim(), fill: 'both',
    })
    const crop = image?.animate([{ transform: imageTransform, opacity: imageOpacity }, { transform: imageCrop(source, base), opacity: 1 }], {
      duration: 200, easing: getComputedStyle(sheet).getPropertyValue('--ease-in-out').trim(), fill: 'both',
    })
    const blend = fade?.animate([{ opacity: fadeOpacity }, { opacity: 0 }], {
      duration: 200, easing: getComputedStyle(sheet).getPropertyValue('--ease-in-out').trim(), fill: 'both',
    })
    // Keep the retracting footer attached to the moving poster on exit.
    const footer = sheet.querySelector<HTMLElement>('.room-sheet__content')
    // The footer overlaps the poster by 1px to cover its rasterized edge.
    const footerOffset = footer ? footer.getBoundingClientRect().top - base.top : base.height
    const attached = footer?.animate([
      { transformOrigin: `0px ${-footerOffset}px`, transform: transformBetween(current, base) },
      { transformOrigin: `0px ${-footerOffset}px`, transform: transformBetween(to, base) },
    ], {
      duration: 200, easing: getComputedStyle(sheet).getPropertyValue('--ease-in-out').trim(), fill: 'both',
    })
    flightRef.current = { source, visibility, animations: [animation, crop, blend, attached].filter((track): track is Animation => !!track) }
    void animation.finished.then(() => {
      if (generation.current !== pass) return
      cancelFlight()
      sheet.close()
      delete sheet.dataset.posterTransition
      delete sheet.dataset.closing
    }).catch(() => {})
  }, [ref, fadeClose, cancelFlight])

  const settle = useCallback(() => {
    if (!flightRef.current) return
    const sheet = ref.current
    const closing = sheet?.dataset.posterTransition === 'closing'
    cancelFlight()
    if (!sheet) return
    if (closing) sheet.close()
    delete sheet.dataset.posterTransition
    delete sheet.dataset.closing
  }, [ref, cancelFlight])

  // A resize invalidates the measured rectangles; settle at the live layout.
  useEffect(() => {
    window.addEventListener('resize', settle)
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => { if (preference.matches) settle() }
    preference.addEventListener('change', onMotion)
    return () => {
      window.removeEventListener('resize', settle)
      preference.removeEventListener('change', onMotion)
    }
  }, [settle])

  return { ref, open, close, settle }
}
