import { useCallback, useEffect, useRef, useState } from 'react'
import MacbookScene from '../components/macbook/MacbookScene.tsx'
import MacbookDebugPanel from '../components/macbook/MacbookDebugPanel.tsx'
import MacbookHeroTitle from '../components/macbook/MacbookHeroTitle.tsx'
import { useMacbookIntro } from '../components/macbook/useMacbookIntro.ts'
import Problem from '../components/Problem.tsx'
import Steps from '../components/Steps.tsx'
import Rooms from '../components/Rooms.tsx'
import Notice from '../components/Notice.tsx'
import Footer from '../components/Footer.tsx'
import { useReveal } from '../hooks/useReveal.ts'
import { useStepBackground } from '../hooks/useStepBackground.ts'
import { INITIAL_MACBOOK_SNAPSHOT, type MacbookController, type MacbookLoadStatus } from '../components/macbook/macbook-config.ts'
import logo from '../assets/optimized/hero/logo.webp'
import chevronDown from '../assets/hero/chevron-down.svg'
import '../styles/macbook-test.css'

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

type Props = { onHome: () => void; onOpenRooms: () => void }

export default function MacbookTestPage({ onHome, onOpenRooms }: Props) {
  const mainRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLHeadingElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<MacbookController | null>(null)
  const [snapshot, setSnapshot] = useState(INITIAL_MACBOOK_SNAPSHOT)
  const [status, setStatus] = useState<MacbookLoadStatus>('loading')
  const [paused, setPaused] = useState(false)
  const [introReady, setIntroReady] = useState(false)
  const [introCycle, setIntroCycle] = useState(0)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const mobile = useMediaQuery('(max-width: 767px)')
  const debug = new URLSearchParams(window.location.search).get('debug') === '1'
  const { complete: introComplete, titleReady } = useMacbookIntro(scrollRef, introReady, status, reducedMotion, introCycle)
  useReveal(mainRef)
  useStepBackground(mainRef)
  const onTypingComplete = useCallback(() => setIntroReady(true), [])
  const reset = useCallback(() => {
    setPaused(false)
    controllerRef.current?.reset()
    setIntroReady(false)
    setIntroCycle(current => current + 1)
  }, [])

  useEffect(() => {
    const originalTitle = document.title
    document.title = '캡슐 CAPSULE · MacBook Hero 실험'
    return () => { document.title = originalTitle }
  }, [])

  return (
    <main ref={mainRef} className="macbook-test-page">
      <section
        className="hero macbook-test macbook-test__scroll" ref={scrollRef}
        data-reduced-motion={reducedMotion} data-model-status={status}
        data-intro-ready={introReady} data-model-visible={snapshot.modelVisible}
        data-intro-complete={introComplete} data-front-view={snapshot.frontView}
        data-hinge-angle={snapshot.hingeDegrees.toFixed(2)}
        data-height={snapshot.height.toFixed(4)}
        data-rotation={snapshot.rotationDegrees.toFixed(2)}
        data-screen-brightness={snapshot.screenBrightness.toFixed(3)}
        aria-labelledby="hero-title"
      >
        <div className="macbook-test__stage">
          <div className="macbook-test__scene">
            <MacbookScene
              scrollRef={scrollRef} copyRef={copyRef} anchorRef={anchorRef}
              controllerRef={controllerRef} onSnapshot={setSnapshot} onStatusChange={setStatus}
              paused={paused} introReady={introReady} reducedMotion={reducedMotion} mobile={mobile}
            />
          </div>
          <div className="hero__inner macbook-test__branding">
            <header className="hero__header">
              <img className="logo" data-intro-item="logo" src={logo} alt="CAPSULE" width={94} height={31} />
            </header>
            <div className="hero__content">
              <MacbookHeroTitle copyRef={copyRef} reducedMotion={reducedMotion} cycle={introCycle} start={titleReady} onComplete={onTypingComplete} />
              <figure className="hero__preview">
                <div className="macbook-test__model-space" ref={anchorRef} aria-hidden="true" />
                <figcaption><span data-landing-item="caption">실제 스터디룸 화면 · 노트북 웹캠으로 함께 공부해요</span></figcaption>
              </figure>
              <p className="hero__subtitle">
                <span data-landing-item="subtitle">
                  딴짓하면 고개를 드는 AI 캐릭터와<br />
                  함께하는 캠스터디, <span className="accent">캡슐</span>
                </span>
              </p>
            </div>
            <div className="macbook-test__hint-scroll">
              <a className="scroll-hint" data-intro-item="hint" href="#problem" onClick={event => {
                event.preventDefault()
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
          {status === 'loading' && introReady && <div className="macbook-test__loading" role="status">맥북을 불러오는 중</div>}
          {debug && (
            <>
              <button className="macbook-test__home-link" type="button" onClick={onHome}>랜딩페이지로 ↗</button>
              <MacbookDebugPanel snapshot={snapshot} status={status} paused={paused} reducedMotion={reducedMotion} onPause={() => setPaused(current => !current)} onReset={reset} />
            </>
          )}
          <small className="macbook-test__credit" data-intro-item="credit">
            MacBook by <a href="https://sketchfab.com/jackbaeten" target="_blank" rel="noreferrer">jackbaeten</a> · CC BY 4.0 · modified
          </small>
        </div>
      </section>
      <div className="story macbook-test__story">
        <Problem />
        <Steps />
        <Rooms onOpenRooms={onOpenRooms} />
        <Notice />
        <Footer />
      </div>
    </main>
  )
}
