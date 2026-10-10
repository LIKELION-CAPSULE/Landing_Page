import { useRef, type MouseEvent } from 'react'
import { useHeroExitFallback } from '../hooks/useHeroExitFallback.ts'
import logo from '../assets/optimized/hero/logo.webp'
import studyRoomPreview from '../assets/optimized/hero/study-room-preview.webp'
import chevronDown from '../assets/hero/chevron-down.svg'

export default function Hero() {
  const innerRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLAnchorElement>(null)
  useHeroExitFallback(innerRef, hintRef)

  // Scroll hint → glide to the story instead of jumping.
  const handleHintClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('problem')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner" ref={innerRef}>
        <header className="hero__header">
          <img className="logo" src={logo} alt="CAPSULE" width={94} height={31} />
        </header>

        <div className="hero__content">
          <h1 className="hero__title" id="hero-title">
            <span>오늘도 혼자 공부해?</span>
            <span className="accent">나랑 같이 하자.</span>
          </h1>

          <figure className="hero__preview">
            <img src={studyRoomPreview} alt="노트북 화면에서 AI 캐릭터들과 함께하는 캠스터디" width={364} height={225} fetchPriority="high" decoding="async" />
            <figcaption>실제 스터디룸 화면 · 노트북 웹캠으로 함께 공부해요</figcaption>
          </figure>

          <p className="hero__subtitle">
            딴짓하면 고개를 드는 AI 캐릭터와<br />
            함께하는 캠스터디, <span className="accent">캡슐</span>
          </p>
        </div>

        <a className="scroll-hint" href="#problem" ref={hintRef} onClick={handleHintClick}>
          <span>스크롤해서 캡슐 더 알아보기</span>
          <span className="scroll-hint__arrow" aria-hidden="true"><img src={chevronDown} alt="" /></span>
        </a>
      </div>
    </section>
  )
}
