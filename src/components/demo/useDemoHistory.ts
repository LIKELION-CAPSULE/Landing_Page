import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export function useDemoHistory(content: string, reduced: boolean, mobile: boolean) {
  const history = useRef<HTMLDivElement>(null)
  const following = useRef(true)
  const animation = useRef<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [unread, setUnread] = useState(false)

  const refresh = useCallback(() => {
    const element = history.current
    if (element) setScrolled(element.scrollTop > .5)
  }, [])
  const stopJump = useCallback(() => {
    if (animation.current !== null) cancelAnimationFrame(animation.current)
    animation.current = null
  }, [])
  const onScroll = () => {
    const element = history.current
    if (!element) return
    refresh()
    if (animation.current !== null) return
    following.current = element.scrollHeight - element.clientHeight - element.scrollTop < 48
    if (following.current) setUnread(false)
  }
  const toBottom = useCallback(() => {
    const element = history.current
    if (!element) return
    element.scrollTop = element.scrollHeight
    refresh()
  }, [refresh])
  const jumpToLatest = () => {
    stopJump()
    following.current = true
    setUnread(false)
    history.current?.focus({ preventScroll: true })
    if (reduced) { toBottom(); return }
    const element = history.current
    if (!element) return
    const start = element.scrollTop, began = performance.now()
    const tick = (now: number) => {
      const fraction = Math.min(1, (now - began) / 200)
      const end = Math.max(0, element.scrollHeight - element.clientHeight)
      element.scrollTop = start + (end - start) * (1 - (1 - fraction) ** 3)
      refresh()
      if (fraction < 1) animation.current = requestAnimationFrame(tick)
      else { animation.current = null; toBottom() }
    }
    animation.current = requestAnimationFrame(tick)
  }

  useLayoutEffect(() => {
    if (mobile) return
    const element = history.current
    if (element && element.scrollHeight <= element.clientHeight) following.current = true
    if (following.current) {
      // Letter-by-letter updates must stay at the bottom without restarting a
      // smooth animation on every character. Only the explicit jump animates.
      if (animation.current === null) toBottom()
      setUnread(false)
    } else setUnread(true)
    refresh()
  }, [content, mobile, refresh, toBottom])
  useLayoutEffect(() => {
    const element = history.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      if (following.current && animation.current === null) toBottom()
      else refresh()
    })
    observer.observe(element)
    return () => { observer.disconnect(); stopJump() }
  }, [refresh, stopJump, toBottom])
  useLayoutEffect(() => {
    if (reduced && animation.current !== null) { stopJump(); toBottom() }
  }, [reduced, stopJump, toBottom])

  return { history, scrolled, unread, onScroll, stopJump, jumpToLatest }
}
