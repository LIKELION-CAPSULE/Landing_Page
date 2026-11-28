import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import CallCta, { PhaseText } from './CallCta.tsx'
import CallIcon from './CallIcon.tsx'
import { MOBILE_QUERY, type CtaState } from '../../lib/cta.ts'
import { track } from '../../lib/analytics.ts'
import { speakingTime } from '../../data/chaerin-demo.ts'
import { MATES, mateById, type MateId } from '../../data/mates.ts'
import { REDUCED_MOTION_QUERY, useMedia, useTabVisible } from '../../hooks/useMedia.ts'
import { CLOSE_UP_TALL, CLOSE_UP_WIDE, closeUpK, closeUpStillCss, closeUpView, EYES_MODEL_Y } from '../../lib/live2d/view.ts'
import { useLiveMate, type StageFrame } from './useLiveMate.ts'
import logo from '../../assets/brand/capsule-horizontal-color.svg'
import roomLandscape from '../../assets/scene/chaerin-call-bg-landscape.webp'
import roomPortrait from '../../assets/scene/chaerin-call-bg-portrait.webp'
import './CallHero.css'

// Portrait windows and phones frame the face in the top media box (CLOSE_UP_TALL); others close up on the right.
const TALL_QUERY = '(max-width: 767px), (max-aspect-ratio: 1/1)'
const still = (framing: typeof CLOSE_UP_WIDE) => Object.entries(closeUpStillCss(framing)).map(([key, value]) => `${key}:${value}`).join(';')
// One source for the still's place (prerendered, no JS) and the live model's view (closeUpView): same numbers.
const STAGE_CSS = `.call-hero__stage{--close-up:wide}.call-hero__still{${still(CLOSE_UP_WIDE)}}@media ${TALL_QUERY}{.call-hero__stage{--close-up:tall}.call-hero__still{${still(CLOSE_UP_TALL)}}}`

const frameOf: StageFrame = stage => {
  const cw = stage.clientWidth, ch = stage.clientHeight
  const framing = getComputedStyle(stage).getPropertyValue('--close-up').trim() === 'tall' ? CLOSE_UP_TALL : CLOSE_UP_WIDE
  const view = closeUpView(cw, ch, framing)
  const k = closeUpK(cw, ch, framing)
  return { view, face: { x: framing.cx * cw, y: ch / 2 + (EYES_MODEL_Y - view.cy) * k } }
}

// The fixed site header lives outside <main> (banner landmark). LandingPage owns the shared
// CTA state; the hero reports whether its own CTA has slid under the header.
export function CallHeader({ cta, ctaVisible }: { cta: CtaState | null; ctaVisible: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 24)
    scroll()
    window.addEventListener('scroll', scroll, { passive: true })
    return () => window.removeEventListener('scroll', scroll)
  }, [])
  return (
    <header className="call-header" data-scrolled={scrolled || undefined}>
      <div className="call-header__inner">
        <a href="#top" className="call-header__brand" aria-label="캡슐 CAPSULE 처음으로"><img src={logo} width="1992" height="456" alt="" draggable={false} /></a>
        <div className="call-header__cta" data-visible={ctaVisible || undefined} inert={!ctaVisible} aria-hidden={!ctaVisible}><CallCta placement="header" state={cta} /></div>
      </div>
    </header>
  )
}

const DOCK = [
  { key: 'mic', icon: 'mic' },
  { key: 'chat', icon: 'chat' },
  { key: 'voice', icon: 'headphones' },
  { key: 'camera', icon: 'videoOff', divider: true, device: true },
  { key: 'pip', icon: 'pip', divider: true },
  { key: 'leave', icon: 'phoneOff', divider: true, danger: true },
] as const

export default function CallHero({ cta, onHeaderCtaVisibleChange }: { cta: CtaState | null; onHeaderCtaVisibleChange: (visible: boolean) => void }) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const mobile = useMedia(MOBILE_QUERY)
  const reduced = useMedia(REDUCED_MOTION_QUERY)
  const tabVisible = useTabVisible()
  const [inView, setInView] = useState(true)
  const [userPaused, setUserPaused] = useState(false)
  const [mateId, setMateId] = useState<MateId>('chaerin')
  // The other mate's still is fetched only after the page has loaded (or when chosen).
  const [warm, setWarm] = useState(false)
  const [elapsed, setElapsed] = useState(12)
  const mate = mateById(mateId)
  const active = inView && tabVisible && !userPaused
  const { live, talk } = useLiveMate({ mateId, stage, host, active, reduced, frame: frameOf })
  const liveNow = live === mateId

  useEffect(() => {
    const element = section.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 })
    observer.observe(element)
    const warmUp = () => setWarm(true)
    if (document.readyState === 'complete') warmUp()
    else window.addEventListener('load', warmUp, { once: true })
    return () => { observer.disconnect(); window.removeEventListener('load', warmUp) }
  }, [])

  useEffect(() => {
    const button = copy.current?.querySelector('.call-cta--hero .call-cta__slot')
    if (!button || mobile) { onHeaderCtaVisibleChange(false); return }
    // Account for the fixed header: a CTA underneath it is no longer visible.
    const observer = new IntersectionObserver(([entry]) => onHeaderCtaVisibleChange(!entry.isIntersecting), { rootMargin: '-80px 0px 0px 0px' })
    observer.observe(button)
    return () => observer.disconnect()
  }, [mobile, onHeaderCtaVisibleChange])

  // The call clock runs only while the scene does.
  useEffect(() => {
    if (!active || reduced) return
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [active, reduced])

  // Once the live model is on screen, it says its first line (mouth only; the line is in the bubble).
  useEffect(() => {
    if (!liveNow || !active) return
    const timer = window.setTimeout(() => talk(speakingTime(mate.firstLine)), 500)
    return () => window.clearTimeout(timer)
  }, [liveNow, active, talk, mate.firstLine])

  // Size the phone media box once (whole CSS px), as before.
  useLayoutEffect(() => {
    const element = copy.current, hero = section.current
    if (!element || !hero) return
    const observer = new ResizeObserver(() => {
      hero.style.setProperty('--call-copy-height', `${element.offsetHeight}px`)
      hero.style.setProperty('--call-mobile-media-height', `${Math.floor(hero.clientHeight * (window.innerWidth > window.innerHeight ? .52 : .6))}px`)
    })
    observer.observe(element)
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  const choose = useCallback((id: MateId) => {
    setWarm(true)
    setMateId(current => {
      if (current !== id) track('hero_mate_selected', { mate: id })
      return id
    })
  }, [])

  return (
    <section ref={section} className="call-hero" id="top" aria-labelledby="call-hero-title" data-mate={mateId} data-live={liveNow || undefined} data-paused={userPaused || undefined}>
      <style>{STAGE_CSS}</style>
      <div className="call-hero__media" aria-hidden="true">
        <picture className="call-hero__room">
          <source media="(max-aspect-ratio: 1/1)" srcSet={roomPortrait} />
          <img src={roomLandscape} alt="" width="1600" height="1200" decoding="async" draggable={false} />
        </picture>
        <div ref={stage} className="call-hero__stage">
          {MATES.map(item => (item.id === mateId || warm) && (
            <img key={item.id} className="call-hero__still" src={item.hero} alt="" data-current={item.id === mateId || undefined}
              width="1520" height="1800" fetchPriority={item.id === 'chaerin' ? 'high' : 'low'} decoding={item.id === 'chaerin' ? 'sync' : 'async'} draggable={false} />
          ))}
          <div ref={host} className="call-hero__live" />
        </div>
      </div>
      <div className="call-hero__shade" aria-hidden="true" />

      <div className="call-meta">
        <span className="call-meta__pill call-meta__connection" aria-hidden="true">
          <span className="call-meta__name"><i />{mate.name}<small>{mate.tags[1]}</small></span>
          <span className="call-meta__time">{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</span>
        </span>
        <span className="call-meta__pill call-meta__ai">AI 캐릭터</span>
      </div>

      <div ref={copy} className="call-hero__copy">
        <h1 id="call-hero-title"><span>나만의 AI 메이트와,</span>{' '}<span>영상통화하듯 함께</span></h1>
        <p className="call-hero__subtitle">말을 걸면 목소리로 대답하고,<br className="call-hero__desktop-break" /> 함께한 시간만큼 새 세계관이 열려요.</p>
        <div className="call-mates" role="group" aria-label="첫 화면에 보일 메이트">
          {MATES.map(item => (
            <button key={item.id} type="button" className="call-mate" aria-pressed={item.id === mateId} onClick={() => choose(item.id)}>
              <img src={item.avatar} alt="" width="48" height="48" draggable={false} />{item.name}
            </button>
          ))}
        </div>
        <CallCta placement="hero" state={cta} />
        <p className="call-hero__beta"><PhaseText before="웹 베타 · 무료 · 선착순 100명" after="12월 1일 웹 베타 · 무료 · 선착순 100명" /></p>
      </div>

      <p className="sr-only">{mate.name}은 AI 캐릭터예요. 화면은 영상통화 예시이고, 대사는 첫 만남 때의 예시예요. {mate.name}: {mate.firstLine}</p>
      <div className="call-dialogue" aria-hidden="true">
        <p key={mateId} className="call-bubble call-bubble--mate"><span>{mate.name}</span>{mate.firstLine}</p>
      </div>
      <div className="call-self" aria-hidden="true">
        <div className="call-self__bar"><span>나</span><span className="call-self__state"><i /><CallIcon name="cameraSmall" size={12} /></span></div>
        <div className="call-self__body"><span className="call-self__avatar"><CallIcon name="person" size={28} /></span><small>카메라 꺼짐</small></div>
      </div>
      <div className="call-dock" aria-hidden="true">
        {DOCK.map(item => <span key={item.key} className="call-dock__item" data-divider={'divider' in item || undefined} data-device={'device' in item || undefined} data-danger={'danger' in item || undefined}><CallIcon name={item.icon} size={20} /></span>)}
      </div>
      {liveNow && !reduced && (
        <button className="call-motion" type="button" aria-label={userPaused ? '움직임 재생' : '움직임 일시정지'} onClick={() => setUserPaused(value => !value)}>
          <CallIcon name={userPaused ? 'play' : 'pause'} /><span>{userPaused ? '재생' : '일시정지'}</span>
        </button>
      )}
      <a className="call-scroll" href="#contrast" onClick={event => {
        event.preventDefault()
        track('cta_clicked', { cta: 'scroll_hint', state: cta ?? 'before_open', device: mobile ? 'mobile' : 'desktop' })
        document.getElementById('contrast')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' })
      }}><span>스크롤해서 더 알아보기</span><CallIcon name="down" /></a>
    </section>
  )
}
