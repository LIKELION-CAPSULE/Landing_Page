import { useEffect, useRef, useState, type ReactNode } from 'react'
import neutral from '../../assets/mates/chaerin/neutral.webp'
import landscapeWebm from '../../assets/mates/chaerin/call-landscape.webm'
import landscapeMp4 from '../../assets/mates/chaerin/call-landscape.mp4'
import portraitWebm from '../../assets/mates/chaerin/call-portrait.webm'
import portraitMp4 from '../../assets/mates/chaerin/call-portrait.mp4'
import neutralLandscapePoster from '../../assets/mates/chaerin/call-landscape-poster.webp'
import neutralPortraitPoster from '../../assets/mates/chaerin/call-portrait-poster.webp'
import landscapePoster from '../../assets/mates/chaerin/contrast-landscape-poster.webp'
import portraitPoster from '../../assets/mates/chaerin/contrast-portrait-poster.webp'
import renders from '../../assets/mates/chaerin/renders.json'
import './ContrastSection.css'

const PORTRAIT_QUERY = '(max-aspect-ratio: 1/1)'
const LANDSCAPE_QUERY = '(aspect-ratio > 1/1)'
const REPLY = '…왔냐. 늦었잖아.'
const WAIT_MS = 1200
const CHARACTER_MS = 340
const TALK_START = renders.callVideos.outputTalkStartsSeconds[0]
const TALK_END = renders.callVideos.outputTimeline.find(item => item.at > TALK_START && item.expression === 'neutral')!.at
const TALK_MS = (TALK_END - TALK_START) * 1000
const END_MS = WAIT_MS + Math.max(REPLY.length * CHARACTER_MS, TALK_MS)
type Phase = 'ready' | 'waiting' | 'replying' | 'complete'

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const change = () => setMatches(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [query])
  return matches
}

// Static Lucide-style, 24px/2px icons: these lists describe the demo, not controls.
function DetailIcon({ children }: { children: ReactNode }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}
const icons = {
  chat: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  window: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18m-12 6 6 0" /></>,
  voice: <><path d="M2 10v4m4-7v10m4-14v18m4-14v10m4-7v4m4-5v6" /></>,
  face: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>,
  presence: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2m-2-8 2 2 3-3" /></>,
  pip: <><rect x="2" y="3" width="20" height="18" rx="2" /><rect x="12" y="11" width="7" height="7" rx="1" /></>,
}

export default function ContrastSection() {
  const section = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const callTitle = useRef<HTMLHeadingElement>(null)
  const elapsed = useRef(0)
  const triggered = useRef(false)
  const portrait = useMedia(PORTRAIT_QUERY)
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const [inView, setInView] = useState(false)
  const [tabVisible, setTabVisible] = useState(() => !document.hidden)
  const [started, setStarted] = useState(false)
  const [phase, setPhase] = useState<Phase>('ready')
  const [letters, setLetters] = useState(0)
  const [run, setRun] = useState(0)
  const complete = reduced || phase === 'complete'
  const active = started && inView && tabVisible && !reduced && !complete
  const poster = reduced
    ? (portrait ? portraitPoster : landscapePoster)
    : (portrait ? neutralPortraitPoster : neutralLandscapePoster)

  useEffect(() => {
    const element = section.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      // IO considers a zero-area, edge-adjacent rectangle intersecting too.
      setInView(entry.isIntersecting && entry.intersectionRect.height > 0)
      // A stacked mobile section is taller than the viewport. Use 60% of the
      // height it is possible to see, otherwise its trigger is unreachable.
      const available = Math.min(entry.boundingClientRect.height, entry.rootBounds?.height ?? window.innerHeight)
      if (!triggered.current && entry.intersectionRect.height >= available * .6) {
        triggered.current = true
        setStarted(true)
      }
    }, { threshold: Array.from({ length: 101 }, (_, index) => index / 100) })
    observer.observe(element)
    const visibility = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  useEffect(() => {
    const element = video.current
    if (!element || !active) { element?.pause(); return }
    let frame = 0
    let previous = 0
    let disposed = false
    let playRequested = false
    const tick = (now: number) => {
      if (disposed) return
      const replying = elapsed.current >= WAIT_MS
      // Pause the demonstration clock while a video frame is buffering, so
      // both versions start the same line together even on a slow connection.
      if (previous && (!replying || element.readyState >= 2)) elapsed.current += now - previous
      previous = now
      const time = elapsed.current
      const speaking = time >= WAIT_MS && time < WAIT_MS + TALK_MS
      if (speaking && !playRequested && element.readyState >= 2) {
        playRequested = true
        void element.play().catch(() => { playRequested = false })
      }
      // Stop one rendered frame before neutral, preserving the contempt frame.
      if (element.currentTime >= TALK_END - 1 / renders.callVideos.fps || time >= WAIT_MS + TALK_MS) {
        element.pause()
        if (element.currentTime >= TALK_END) element.currentTime = TALK_END - 1 / renders.callVideos.fps
      }
      setPhase(time >= END_MS ? 'complete' : time < WAIT_MS ? 'waiting' : 'replying')
      setLetters(Math.min(REPLY.length, Math.floor(Math.max(0, time - WAIT_MS) / CHARACTER_MS)))
      if (time < END_MS) frame = requestAnimationFrame(tick)
    }
    const prepare = () => {
      element.currentTime = Math.min(TALK_START + Math.max(0, elapsed.current - WAIT_MS) / 1000, TALK_END - 1 / renders.callVideos.fps)
    }
    if (element.readyState >= 1) prepare()
    element.addEventListener('loadedmetadata', prepare)
    frame = requestAnimationFrame(tick)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      element.pause()
      element.removeEventListener('loadedmetadata', prepare)
    }
  }, [active, portrait, run])

  const replay = () => {
    elapsed.current = 0
    setLetters(0)
    setPhase('waiting')
    setStarted(true)
    setRun(value => value + 1)
    // The button hides while the demo replays; keep keyboard focus in this card.
    callTitle.current?.focus({ preventScroll: true })
  }

  return (
    <section className="contrast" id="contrast" ref={section} aria-labelledby="contrast-title" data-phase={reduced ? 'reduced' : phase} data-active={active}>
      <header className="contrast__heading">
        <h2 id="contrast-title">글로만 대화하던 캐릭터,<br />이제 얼굴 보고 이야기해요</h2>
        <p>이야기는 그대로, 경험은 영상통화처럼.</p>
      </header>
      <p className="sr-only">같은 대사를 채팅은 글로, 캡슐은 목소리와 표정으로 전해요. 채린은 AI 캐릭터예요.</p>
      <div className="contrast__cards">
        <article className="contrast-card contrast-card--chat" aria-labelledby="contrast-chat-title">
          <h3 id="contrast-chat-title">읽는 채팅</h3>
          <div className="contrast-chat" aria-hidden="true">
            <div className="contrast-chat__profile"><div><img src={neutral} alt="" loading="lazy" width="1600" height="1200" /></div><span>채린</span></div>
            <div className="contrast-chat__messages">
              <p className="contrast-chat__self">나 왔어</p>
              <div className="contrast-chat__mate">
                <span className="contrast-chat__name">채린</span>
                <div className="contrast-chat__reply">
                  <span className="contrast-chat__reserve">{REPLY}</span>
                  {!complete && letters === 0 ? <span className="contrast-chat__typing">입력 중<span className="contrast-dots"><i /><i /><i /></span></span> : <span className="contrast-chat__typed">{complete ? REPLY : REPLY.slice(0, letters)}</span>}
                </div>
              </div>
            </div>
            <div className="contrast-chat__composer"><span>메시지 입력</span><span>↑</span></div>
          </div>
          <ul className="contrast-card__details">
            <li><DetailIcon>{icons.chat}</DetailIcon>입력하고 답을 기다려요</li>
            <li><DetailIcon>{icons.image}</DetailIcon>같은 그림 몇 장으로 표정을 상상해요</li>
            <li><DetailIcon>{icons.window}</DetailIcon>작업할 땐 창을 닫아 둬요</li>
          </ul>
        </article>
        <article className="contrast-card contrast-card--call" aria-labelledby="contrast-call-title">
          <h3 id="contrast-call-title" ref={callTitle} tabIndex={-1}><span className="contrast-card__signal" aria-hidden="true" />캡슐의 통화</h3>
          <div className="contrast-call" aria-hidden="true" data-speaking={!reduced && phase === 'replying' && letters * CHARACTER_MS < TALK_MS}>
            <video key={portrait ? 'portrait' : 'landscape'} ref={video} muted playsInline preload={reduced ? 'none' : 'metadata'} poster={poster}>
              <source src={portraitWebm} type="video/webm" media={PORTRAIT_QUERY} />
              <source src={portraitMp4} type="video/mp4" media={PORTRAIT_QUERY} />
              <source src={landscapeWebm} type="video/webm" media={LANDSCAPE_QUERY} />
              <source src={landscapeMp4} type="video/mp4" media={LANDSCAPE_QUERY} />
            </video>
            {(!started || phase === 'waiting' || reduced) && <img className="contrast-call__poster" src={poster} alt="" loading="lazy" width={portrait ? 1080 : 1920} height={portrait ? 1920 : 1080} />}
            <div className="contrast-call__top"><span className="contrast-call__status"><i />채린 · 연결 중</span><span>AI 캐릭터</span></div>
            {/* One bottom row keeps the caption and my cam on the same centre line. */}
            <div className="contrast-call__bottom">
              {(complete || phase === 'replying') && <div className="contrast-call__caption"><span>채린</span><p>{REPLY}</p></div>}
              <div className="contrast-call__cam"><DetailIcon>{icons.presence}</DetailIcon><span>내 캠</span></div>
            </div>
          </div>
          <ul className="contrast-card__details">
            <li><DetailIcon>{icons.voice}</DetailIcon>목소리로 대답해요</li>
            <li><DetailIcon>{icons.face}</DetailIcon>대화에 따라 표정이 바뀌어요</li>
            <li><DetailIcon>{icons.presence}</DetailIcon>자리를 비우면 알아채요</li>
            <li><DetailIcon>{icons.pip}</DetailIcon>작업 옆에 띄워 둬요</li>
          </ul>
          <div className="contrast-call__footer">
            <div className="contrast__replay-slot">{!reduced && <button type="button" className="contrast__replay" onClick={replay} style={{ visibility: complete ? 'visible' : 'hidden' }}><DetailIcon><path d="M3 11a9 9 0 1 1 2.4 6.1M3 4v7h7" /></DetailIcon>다시 보기</button>}</div>
          </div>
        </article>
      </div>
      <div className="contrast__after">
        <p className="contrast__closing">이야기는 기본이에요.<br className="contrast__mobile-break" /> <span>캡슐은 반응해요.</span></p>
      </div>
    </section>
  )
}
