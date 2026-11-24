import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import CallCta from './CallCta.tsx'
import CallIcon from './CallIcon.tsx'
import { MOBILE_QUERY, type CtaState } from '../../lib/cta.ts'
import { track } from '../../lib/analytics.ts'
import logo from '../../assets/hero/logo-lockup.svg'
import landscapeWebm from '../../assets/mates/chaerin/call-landscape.webm'
import landscapeMp4 from '../../assets/mates/chaerin/call-landscape.mp4'
import portraitWebm from '../../assets/mates/chaerin/call-portrait.webm'
import portraitMp4 from '../../assets/mates/chaerin/call-portrait.mp4'
import landscapePoster from '../../assets/mates/chaerin/call-landscape-poster.webp'
import portraitPoster from '../../assets/mates/chaerin/call-portrait-poster.webp'
import './CallHero.css'

const PORTRAIT_QUERY = '(max-aspect-ratio: 1/1)'
const LANDSCAPE_QUERY = '(aspect-ratio > 1/1)'

// These times match the rendered video in renders.json (not a wall-clock animation).
const HERO_DIALOGUE = [
  { id: 1, at: 0.85, speaker: 'mate', text: '…왔냐. 늦었잖아.' },
  { id: 2, at: 2.85, speaker: 'self', text: '미안, 과제 끝내고 오느라' },
  { id: 3, at: 3.6, speaker: 'mate', text: '됐어. 빨리 앉기나 해.' },
  { id: 4, at: 6.2, speaker: 'mate', text: '늦었으니까 딸기우유는 네가 사는 거다.' },
] as const

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const changed = () => setMatches(media.matches)
    media.addEventListener('change', changed)
    return () => media.removeEventListener('change', changed)
  }, [query])
  return matches
}

// The fixed site header lives outside <main> (banner landmark). LandingPage owns the shared
// CTA state; the hero reports whether its own CTA has slid under the header.
export function CallHeader({ cta, ctaVisible }: { cta: CtaState; ctaVisible: boolean }) {
  const mobile = useMedia(MOBILE_QUERY)
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24)
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => window.removeEventListener('scroll', scroll)
  }, [])
  return (
    <header className="call-header" data-scrolled={scrolled || undefined}>
      <div className="call-header__inner">
        <img src={logo} width="1992" height="456" alt="캡슐 CAPSULE" draggable={false} />
        {!mobile && <div className="call-header__cta" data-visible={ctaVisible || undefined} inert={!ctaVisible} aria-hidden={!ctaVisible}><CallCta placement="header" state={cta} mobile={false} /></div>}
      </div>
    </header>
  )
}

export default function CallHero({ cta, onHeaderCtaVisibleChange }: { cta: CtaState; onHeaderCtaVisibleChange: (visible: boolean) => void }) {
  const section = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const bubbles = useRef<HTMLDivElement>(null)
  const bubbleIds = useRef(new Set<number>())
  const mobile = useMedia(MOBILE_QUERY)
  const portrait = useMedia(PORTRAIT_QUERY)
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const [inView, setInView] = useState(true)
  const [tabVisible, setTabVisible] = useState(() => !document.hidden)
  const [userPaused, setUserPaused] = useState(false)
  const [motionOptIn, setMotionOptIn] = useState(false)
  const [ready, setReady] = useState(false)
  const [posterPainted, setPosterPainted] = useState(false)
  const posterImage = useRef<HTMLImageElement>(null)
  // Paint the eagerly loaded poster before revealing decoded motion. A failed poster
  // must not keep the video hidden forever, so errors release the gate too.
  const posterSettled = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setPosterPainted(true)))
  }, [])
  // A cached poster can finish before React attaches onLoad; settle it on mount.
  useEffect(() => { if (posterImage.current?.complete) posterSettled() }, [posterSettled])
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(12)
  const [dialogue, setDialogue] = useState<{ ids: number[]; fading: number[] }>({ ids: [], fading: [] })
  const staticMotion = reduced && !motionOptIn
  const active = inView && tabVisible && !userPaused && !staticMotion
  const currentPoster = portrait ? portraitPoster : landscapePoster

  useEffect(() => {
    const visibility = () => setTabVisible(!document.hidden)
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 })
    if (section.current) observer.observe(section.current)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  useEffect(() => {
    const button = copy.current?.querySelector('.call-cta--hero > :is(button, a)')
    if (!button || mobile) return
    // Account for the fixed header: a CTA underneath it is no longer visible.
    const observer = new IntersectionObserver(([entry]) => onHeaderCtaVisibleChange(!entry.isIntersecting), { rootMargin: '-80px 0px 0px 0px' })
    observer.observe(button)
    return () => observer.disconnect()
  }, [mobile, cta, onHeaderCtaVisibleChange])

  useLayoutEffect(() => {
    const element = copy.current
    if (!element) return
    const hero = section.current
    const observer = new ResizeObserver(() => {
      hero?.style.setProperty('--call-copy-height', `${element.offsetHeight}px`)
      // Align poster/video framing to whole CSS pixels; avoid a fractional edge
      // making the decoded video larger than the already painted poster.
      if (hero) hero.style.setProperty('--call-mobile-media-height', `${Math.floor(hero.clientHeight * (window.innerWidth > window.innerHeight ? .52 : .65))}px`)
    })
    observer.observe(element)
    if (hero) observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = video.current
    if (!element) return
    if (active) void element.play().catch(() => { /* Poster and the explicit play control remain available. */ })
    else element.pause()
  }, [active, portrait])

  useEffect(() => {
    if (!active || !playing) return
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [active, playing])

  useEffect(() => {
    const element = video.current
    if (!element || staticMotion) return
    let callback = 0
    let lastKey = ''
    const update = (time: number) => {
      const visible = HERO_DIALOGUE.filter(line => time >= line.at && time < Math.min(line.at + 6.8, 9.3)).slice(mobile ? -2 : -3)
      const ids = visible.map(line => line.id)
      const oldest = visible.length === (mobile ? 2 : 3) ? visible[0]?.id : undefined
      const fading = visible.filter(line => line.id === oldest || time - line.at > 4.2).map(line => line.id)
      const key = `${ids.join(',')}/${fading.join(',')}`
      if (key !== lastKey) { lastKey = key; setDialogue({ ids, fading }) }
    }
    const frame: VideoFrameRequestCallback = (_now, metadata) => {
      update(metadata.mediaTime)
      callback = element.requestVideoFrameCallback(frame)
    }
    const fallback = () => update(element.currentTime)
    const seek = () => update(element.currentTime)
    element.addEventListener('seeked', seek)
    if (typeof element.requestVideoFrameCallback === 'function') callback = element.requestVideoFrameCallback(frame)
    else element.addEventListener('timeupdate', fallback)
    return () => {
      if (callback) element.cancelVideoFrameCallback(callback)
      element.removeEventListener('timeupdate', fallback); element.removeEventListener('seeked', seek)
    }
  }, [mobile, portrait, staticMotion])

  const shown = staticMotion ? [HERO_DIALOGUE[0], HERO_DIALOGUE[1]] : HERO_DIALOGUE.filter(line => dialogue.ids.includes(line.id))
  useLayoutEffect(() => {
    const next = new Set<number>()
    bubbles.current?.querySelectorAll<HTMLElement>('[data-message]').forEach(node => {
      const id = Number(node.dataset.message)
      if (reduced) node.getAnimations().forEach(animation => animation.cancel())
      else if (!bubbleIds.current.has(id)) {
        const style = getComputedStyle(node)
        // Grow layout space so older lines move upward without crossing a new one.
        node.animate([
          { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 },
          { height: `${node.offsetHeight}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, opacity: style.opacity },
        ], { duration: 240, easing: 'ease-out' })
      }
      next.add(id)
    })
    bubbleIds.current = next
  }, [dialogue, mobile, portrait, staticMotion, reduced])
  const bubble = (line: typeof HERO_DIALOGUE[number]) => <p key={line.id} className={`call-bubble call-bubble--${line.speaker}`} data-message={line.id} data-fading={!staticMotion && dialogue.fading.includes(line.id) || undefined}>{line.speaker === 'mate' && <span>채린</span>}{line.text}</p>
  const toggle = () => {
    if (staticMotion) { setMotionOptIn(true); setUserPaused(false) }
    else if (playing) setUserPaused(true)
    else { setUserPaused(false); void video.current?.play().catch(() => {}) }
  }

  return (
      <section ref={section} className="call-hero" aria-labelledby="call-hero-title" data-reduced-motion={staticMotion} data-in-view={inView} data-playing={playing} data-video-layout={portrait ? 'portrait' : 'landscape'}>
        <div className="call-hero__media" aria-hidden="true">
          <picture className="call-hero__poster">
            <source media={PORTRAIT_QUERY} srcSet={portraitPoster} />
            <img ref={posterImage} src={landscapePoster} alt="" fetchPriority="high" width="1920" height="1080" onLoad={posterSettled} onError={posterSettled} />
          </picture>
          <video key={portrait ? 'portrait' : 'landscape'} ref={video} data-ready={ready && posterPainted && !staticMotion || undefined} muted autoPlay={!staticMotion} loop playsInline preload="metadata" poster={currentPoster} tabIndex={-1}
            onLoadStart={() => setReady(false)} onLoadedData={() => { if (!staticMotion) setReady(true) }} onPlaying={() => { setPlaying(true); setReady(true) }} onPause={() => setPlaying(false)}>
            <source media={PORTRAIT_QUERY} src={portraitWebm} type="video/webm" />
            <source media={PORTRAIT_QUERY} src={portraitMp4} type="video/mp4" />
            <source media={LANDSCAPE_QUERY} src={landscapeWebm} type="video/webm" />
            <source media={LANDSCAPE_QUERY} src={landscapeMp4} type="video/mp4" />
          </video>
        </div>
        <div className="call-hero__shade" aria-hidden="true" />
        <div className="call-meta" aria-hidden="true">
          <span className="call-meta__pill call-meta__connection"><span className="call-meta__name"><i />채린 · 연결 중</span>
          <span className="call-meta__time">{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</span></span>
          <span className="call-meta__pill call-meta__ai">AI 캐릭터</span>
        </div>
        <div ref={copy} className="call-hero__copy">
          <h1 id="call-hero-title"><span>나만의 AI 캐릭터와,</span>{' '}<span>영상통화하듯 함께</span></h1>
          <p className="call-hero__subtitle">말을 걸면 목소리로 대답하고,<br className="call-hero__desktop-break" /> 함께한 시간만큼 새 에피소드가 열려요.</p>
          <CallCta placement="hero" state={cta} mobile={mobile} />
          <p className="call-hero__beta">{/* Before opening, the button already says "12월 1일 오픈"; don't repeat the date. */}{cta === 'before_open' ? '웹 베타 · 무료 · 선착순 100명' : '12월 1일 웹 베타 · 무료 · 선착순 100명'}</p>
        </div>
        <span className="sr-only">채린은 AI 캐릭터예요. 영상과 말풍선은 예시 대화입니다.</span>
        <p className="sr-only">대화 예시. {HERO_DIALOGUE.map(line => `${line.speaker === 'mate' ? '채린' : '나'}: ${line.text}`).join(' ')}</p>
        <div ref={bubbles} className="call-dialogue" aria-hidden="true">{shown.map(bubble)}</div>
        <div className="call-self" aria-hidden="true"><CallIcon name="person" /><span>내 캠</span><small>카메라 꺼짐</small></div>
        <div className="call-controls" aria-hidden="true">
          {(['mic', 'camera', 'chat', 'pip', 'hangup'] as const).map(name => <span className={name === 'hangup' ? 'call-controls__end' : ''} key={name}><CallIcon name={name} /></span>)}
        </div>
        <button className="call-motion" type="button" aria-label={playing ? '영상 일시정지' : '영상 재생'} onClick={toggle}>
          <CallIcon name={playing ? 'pause' : 'play'} /><span>{playing ? '일시정지' : '재생'}</span>
        </button>
        <a className="call-scroll" href="#contrast" onClick={event => {
          event.preventDefault()
          track('cta_clicked', { cta: 'scroll_hint', state: cta, device: mobile ? 'mobile' : 'desktop' })
          document.getElementById('contrast')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' })
        }}><span>스크롤해서 더 알아보기</span><CallIcon name="down" /></a>
      </section>
  )
}
