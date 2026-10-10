import { useLayoutEffect, useRef } from 'react'

// Author the illustration at Figma's native width. Tiny display-size fonts can
// otherwise be enlarged independently by Android WebView's minimum font size.
export function useDemoCanvas() {
  const stageRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return
    const resize = () => {
      const style = getComputedStyle(stage)
      const width = Number.parseFloat(style.width)
      if (!width) return
      const scale = width / 1480
      canvas.style.height = `${Number.parseFloat(style.height) / scale}px`
      canvas.style.transform = `scale(${scale})`
    }
    resize()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    observer?.observe(stage)
    window.addEventListener('resize', resize)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])
  return { stageRef, canvasRef }
}
