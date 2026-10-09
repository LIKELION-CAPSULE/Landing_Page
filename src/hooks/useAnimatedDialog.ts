import { useCallback, useRef } from 'react'

// showModal() appears instantly and close() vanishes instantly. This plays
// the dialog's CSS exit animation (`[data-closing]`) before really closing.
export function useAnimatedDialog() {
  const ref = useRef<HTMLDialogElement>(null)

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

    const finish = (event: AnimationEvent) => {
      // Ignore animations bubbling from children or running on ::backdrop.
      if (event.target !== dialog || event.pseudoElement) return
      dialog.removeEventListener('animationend', finish)
      delete dialog.dataset.closing
      dialog.close()
    }
    dialog.addEventListener('animationend', finish)
    dialog.dataset.closing = ''
  }, [])

  return { ref, open, close }
}
