import { useCallback, useEffect, useRef } from 'react'

// showModal() appears instantly and close() vanishes instantly. This plays
// the dialog's CSS exit animation (`[data-closing]`) before really closing.
export function useAnimatedDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => () => cleanupRef.current?.(), [])

  const open = useCallback(() => {
    const dialog = ref.current
    if (!dialog || dialog.open) return
    delete dialog.dataset.closing
    dialog.showModal()
  }, [])

  const close = useCallback(() => {
    const dialog = ref.current
    if (!dialog?.open || dialog.dataset.closing !== undefined) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      dialog.close()
      return
    }

    let timer: number
    const cleanup = () => {
      dialog.removeEventListener('animationend', finish)
      dialog.removeEventListener('transitionend', finish)
      window.clearTimeout(timer)
      cleanupRef.current = null
    }
    const finish = (event?: AnimationEvent | TransitionEvent) => {
      // Children and ::backdrop finish independently of the sheet itself.
      if (event && (event.target !== dialog || event.pseudoElement)) return
      cleanup()
      delete dialog.dataset.closing
      dialog.close()
    }
    cleanupRef.current = cleanup
    dialog.addEventListener('animationend', finish)
    dialog.addEventListener('transitionend', finish)
    dialog.dataset.closing = ''
    const style = getComputedStyle(dialog)
    const durations = [style.animationDuration, style.transitionDuration].flatMap(value => value.split(',').map(part => {
      const seconds = part.trim()
      return parseFloat(seconds) * (seconds.endsWith('ms') ? 1 : 1000)
    }))
    // Closing before the entrance starts may produce no end event.
    timer = window.setTimeout(() => finish(), Math.max(0, ...durations) + 100)
  }, [])

  return { ref, open, close }
}
