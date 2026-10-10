import { useCallback, useEffect, useRef, useState } from 'react'
import MacbookScene from '../components/macbook/MacbookScene.tsx'
import MacbookHeroTitle from '../components/macbook/MacbookHeroTitle.tsx'
import { useMacbookIntro } from '../components/macbook/useMacbookIntro.ts'
import Problem from '../components/Problem.tsx'
import Steps from '../components/Steps.tsx'
import Rooms from '../components/Rooms.tsx'
import Notice from '../components/Notice.tsx'
import Footer from '../components/Footer.tsx'
import { useReveal } from '../hooks/useReveal.ts'
import { useStepBackground } from '../hooks/useStepBackground.ts'
import { track } from '../lib/analytics.ts'
import { INITIAL_MACBOOK_SNAPSHOT, type MacbookLoadStatus } from '../components/macbook/macbook-config.ts'
import logo from '../assets/hero/logo-lockup.png'
import chevronDown from '../assets/hero/chevron-down.svg'
import '../styles/macbook-landing.css'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    media.addEventListener('change', update)
    update()
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

type Props = { onOpenRooms: () => void }

export default function MacbookLandingPage({ onOpenRooms }: Props) {
  const mainRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLHeadingElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [snapshot, setSnapshot] = useState(INITIAL_MACBOOK_SNAPSHOT)
  const [status, setStatus] = useState<MacbookLoadStatus>('loading')
  const [introReady, setIntroReady] = useState(false)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const mobile = useMediaQuery('(max-width: 767px)')
  const { complete: introComplete, titleReady } = useMacbookIntro(scrollRef, introReady, status, reducedMotion)
  useReveal(mainRef)
  useStepBackground(mainRef)
  const onTypingComplete = useCallback(() => setIntroReady(true), [])

  return (
    <main ref={mainRef} className="macbook-landing-page" data-macbook-page="landing">
      <section
        className="hero macbook-landing macbook-landing__scroll" ref={scrollRef}
        data-reduced-motion={reducedMotion} data-model-status={status}
        data-intro-ready={introReady} data-model-visible={snapshot.modelVisible}
        data-intro-complete={introComplete} data-front-view={snapshot.frontView}
        data-hinge-angle={snapshot.hingeDegrees.toFixed(2)}
        data-height={snapshot.height.toFixed(4)}
        data-rotation={snapshot.rotationDegrees.toFixed(2)}
        data-screen-brightness={snapshot.screenBrightness.toFixed(3)}
        aria-labelledby="hero-title"
      >
        <div className="macbook-landing__stage">
          <div className="macbook-landing__scene">
            <MacbookScene
              scrollRef={scrollRef} copyRef={copyRef} anchorRef={anchorRef}
              onSnapshot={setSnapshot} onStatusChange={setStatus}
              introReady={introReady} reducedMotion={reducedMotion} mobile={mobile}
            />
          </div>
          <div className="hero__inner macbook-landing__branding">
            <header className="hero__header">
              <div className="logo" data-intro-item="logo">
                <img src={logo} alt="캡슐 CAPSULE" width={2170} height={725} />
              </div>
            </header>
            <div className="hero__content">
              <MacbookHeroTitle copyRef={copyRef} reducedMotion={reducedMotion} start={titleReady} onComplete={onTypingComplete} />
              <figure className="hero__preview">
                <div className="macbook-landing__model-space" ref={anchorRef} aria-hidden="true" />
                <figcaption><span data-landing-item="caption">실제 스터디룸 화면 · 노트북 웹캠으로 함께 공부해요</span></figcaption>
              </figure>
              <p className="hero__subtitle">
                <span data-landing-item="subtitle">
                  딴짓하면 고개를 드는 AI 캐릭터와<br />
                  함께하는 캠스터디, <span className="accent">캡슐</span>
                </span>
              </p>
            </div>
            <div className="macbook-landing__hint-scroll">
              <a className="scroll-hint" data-intro-item="hint" href="#problem" onClick={event => {
                event.preventDefault()
                track('cta_clicked', { cta: 'scroll_hint', path: '/' })
                if (reducedMotion) document.getElementById('problem')?.scrollIntoView({ behavior: 'auto' })
                else {
                  const section = scrollRef.current
                  if (section) window.scrollTo({
                    top: section.getBoundingClientRect().top + window.scrollY + (section.offsetHeight - window.innerHeight) * 0.18,
                    behavior: 'smooth',
                  })
                }
              }}>
                <span>스크롤해서 캡슐 더 알아보기</span>
                <span className="scroll-hint__arrow" aria-hidden="true"><img src={chevronDown} alt="" /></span>
              </a>
            </div>
          </div>
          {status === 'loading' && introReady && <div className="macbook-landing__loading" role="status">맥북을 불러오는 중</div>}
          <small className="macbook-landing__credit" data-intro-item="credit">
            MacBook by <a href="https://sketchfab.com/jackbaeten" target="_blank" rel="noreferrer">jackbaeten</a> · CC BY 4.0 · modified
          </small>
        </div>
      </section>
      <div className="story macbook-landing__story">
        <Problem />
        <Steps />
        <Rooms onOpenRooms={onOpenRooms} />
        <Notice />
        <Footer />
      </div>
    </main>
  )
}
