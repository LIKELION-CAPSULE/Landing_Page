import { useRef, type MouseEvent } from 'react'
import { useHeroExitFallback } from '../hooks/useHeroExitFallback.ts'
import { track } from '../lib/analytics.ts'
import logoIcon from '../assets/hero/logo-icon-sprite.png'
import logoWordmark from '../assets/hero/logo-wordmark-sprite.png'
import poster1 from '../assets/hero/poster-1.png'
import poster2 from '../assets/hero/poster-2.png'
import poster3 from '../assets/hero/poster-3.png'
import poster4 from '../assets/hero/poster-4.png'
import poster5 from '../assets/hero/poster-5.png'
import poster6 from '../assets/hero/poster-6.png'
import poster7 from '../assets/hero/poster-7.png'
import arrow from '../assets/hero/arrow.svg'

export default function Hero() {
  const innerRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLAnchorElement>(null)
  useHeroExitFallback(innerRef, hintRef)

  // Scroll hint → glide to the story instead of jumping.
  const handleHintClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    track('cta_clicked', { cta: 'scroll_hint', path: '/' })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('problem')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner" ref={innerRef}>
        <div className="logo" role="img" aria-label="CAPSULE">
          <span className="logo__icon"><img src={logoIcon} alt="" /></span>
          <span className="logo__wordmark"><img src={logoWordmark} alt="" /></span>
        </div>

        <h1 className="hero__title" id="hero-title">
          <span>같이 공부하고 싶은</span>
          <span className="accent">AI 공부 메이트</span>
        </h1>

        <div className="posters" aria-hidden="true">
          <div className="posters__grid">
            <div className="poster poster--r5 poster--fill"><img src={poster1} alt="" /></div>
            <div className="poster poster--r9"><img src={poster2} alt="" /></div>
            <div className="poster poster--r9"><img src={poster3} alt="" /></div>

            <div className="poster poster--r5 poster--fill poster--crop"><img src={poster4} alt="" /></div>
            <div className="poster"><img src={poster5} alt="" width={116} height={152} /></div>
            <div className="poster poster--r5 poster--fill"><img src={poster6} alt="" /></div>

            <div className="poster"><img src={poster7} alt="" width={116} height={152} /></div>
            <div className="poster poster--r5 poster--fill"></div>
            <div className="poster poster--r5 poster--fill"></div>
          </div>
          <div className="posters__glass"></div>
        </div>

        <a className="scroll-hint" href="#problem" ref={hintRef} onClick={handleHintClick}>
          <span>스크롤해서 캡슐 더 알아보기</span>
          <img className="scroll-hint__arrow" src={arrow} alt="" width={19} height={19} />
        </a>
      </div>
    </section>
  )
}
