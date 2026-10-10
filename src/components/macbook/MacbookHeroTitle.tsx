import { useEffect, useState, type RefObject } from 'react'

const LINES = ['오늘도 혼자 공부해?', '나랑 같이 하자.']
const FIRST_LENGTH = Array.from(LINES[0]).length
const TOTAL_LENGTH = FIRST_LENGTH + Array.from(LINES[1]).length

type Props = {
  copyRef: RefObject<HTMLHeadingElement | null>
  reducedMotion: boolean
  start: boolean
  onComplete: () => void
}

export default function MacbookHeroTitle({ copyRef, reducedMotion, start, onComplete }: Props) {
  const [count, setCount] = useState(reducedMotion ? TOTAL_LENGTH : 0)
  useEffect(() => {
    if (reducedMotion) { onComplete(); return }
    setCount(0)
    if (!start) return
    let cancelled = false
    let index = 0
    let timer = 0
    const type = () => {
      if (cancelled) return
      index += 1
      setCount(index)
      if (index === TOTAL_LENGTH) {
        timer = window.setTimeout(onComplete, 200)
      } else {
        timer = window.setTimeout(type, index === FIRST_LENGTH ? 320 : 70)
      }
    }
    timer = window.setTimeout(type, 100)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [reducedMotion, start, onComplete])

  const visibleCount = reducedMotion ? TOTAL_LENGTH : start ? count : 0
  return (
    <h1 ref={copyRef} className="hero__title" id="hero-title" aria-label={LINES.join(' ')} data-typing={visibleCount < TOTAL_LENGTH}>
      {LINES.map((line, index) => {
        const length = index === 0 ? visibleCount : Math.max(0, visibleCount - FIRST_LENGTH)
        const typing = visibleCount > 0 && visibleCount < TOTAL_LENGTH && (index === 0 ? visibleCount < FIRST_LENGTH : visibleCount >= FIRST_LENGTH)
        return (
          <span key={line} className={`macbook-landing__type-line${index === 1 ? ' accent' : ''}`} aria-hidden="true">
            <span className="macbook-landing__type-reserve">{line}</span>
            <span className="macbook-landing__type-text">
              {Array.from(line).slice(0, length).join('')}
              {typing && <i className="macbook-landing__cursor" />}
            </span>
          </span>
        )
      })}
    </h1>
  )
}
