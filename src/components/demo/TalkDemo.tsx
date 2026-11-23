import { useCallback, useEffect, useRef, useState } from 'react'
import { DEMO_CHIPS, DEMO_SILENCE, DEMO_TIMING, demoTiming, type DemoReply, type DemoExpression } from '../../data/chaerin-demo.ts'
import { track } from '../../lib/analytics.ts'
import CallIcon from '../hero/CallIcon.tsx'
import { demoStill, useDemoClips, type DemoView } from './useDemoClips.ts'
import { useDemoHistory } from './useDemoHistory.ts'
import './TalkDemo.css'

// Module lifetime is the page lifetime, including StrictMode or layout remounts.
const pageSession = { touched: false, silenceShown: false }
type Message = { id: number; speaker: 'self' | 'mate'; text: string; visible: string; complete: boolean }
type Reaction = { item: DemoReply; elapsed: number; replyId: number }
function useMedia(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches)
  useEffect(() => { const media = matchMedia(query), changed = () => setMatches(media.matches); media.addEventListener('change', changed); return () => media.removeEventListener('change', changed) }, [query])
  return matches
}
function textAt(item: DemoReply, elapsed: number) {
  const units = Array.from(item.dialogue.replace(/\s/g, '')).length
  let remaining = Math.floor(Math.max(0, Math.min(1, elapsed / item.talkMs)) * units), result = ''
  for (const character of item.dialogue) {
    if (!/\s/.test(character)) { if (remaining <= 0) break; remaining-- }
    result += character
  }
  return result
}

export default function TalkDemo() {
  const section = useRef<HTMLElement>(null), frame = useRef<HTMLDivElement>(null)
  const [frameView, setFrameView] = useState<DemoView | null>(null)
  const mobile = useMedia('(max-width: 767px)'), compact = useMedia('(max-width: 1023px)'), reduced = useMedia('(prefers-reduced-motion: reduce)')
  const [near, setNear] = useState(false), [inView, setInView] = useState(false), [halfVisible, setHalfVisible] = useState(false)
  const [tabVisible, setTabVisible] = useState(() => !document.hidden), [paused, setPaused] = useState(false)
  const [messages, setMessages] = useState<Message[]>([]), [reaction, setReaction] = useState<Reaction | null>(null), [progress, setProgress] = useState(0), [seconds, setSeconds] = useState(0)
  const run = useRef<Reaction | null>(null), sequence = useRef(0), connection = useRef(0), silenceClock = useRef(0)
  const active = inView && tabVisible && !paused
  const busy = reaction !== null
  const timing = reaction ? demoTiming(reaction.item) : null
  const localTime = Math.max(0, progress - DEMO_TIMING.delayMs)
  const target = reaction && progress >= DEMO_TIMING.delayMs ? reaction.item.id : 'idle'
  const expression: DemoExpression = reaction && progress >= DEMO_TIMING.delayMs
    ? (timing?.turnMs !== null && timing?.turnMs !== undefined && localTime >= timing.turnMs ? reaction.item.expressions.afterEllipsis! : reaction.item.expressions.start)
    : 'neutral'
  const time = useCallback(() => Math.max(0, (run.current?.elapsed ?? 0) - DEMO_TIMING.delayMs), [])
  const media = useDemoClips({ near, inView, active, reduced, frameView, target, time })
  const tall = media.view === 'tall'
  const staticSource = reaction && target !== 'idle' && media.view ? demoStill(media.view, reaction.item.id, expression === reaction.item.expressions.afterEllipsis) : media.poster
  const visibleMessages = messages.filter(message => message.visible)
  const panelMessages = compact ? visibleMessages.slice(-3) : visibleMessages
  const overlayMessages = visibleMessages.slice(-2)
  const historyContent = JSON.stringify(panelMessages.map(message => [message.id, message.visible]))
  const { history: historyRef, scrolled, unread, onScroll, stopJump, jumpToLatest } = useDemoHistory(historyContent, reduced, mobile)

  useEffect(() => {
    const element = frame.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setFrameView(width / height > 1 ? 'wide' : 'tall')
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = section.current
    if (!element) return
    const warm = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNear(true); warm.disconnect() } }, { rootMargin: '600px 0px' })
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting && entry.intersectionRect.height > 0)
      setHalfVisible(entry.intersectionRatio >= .5)
    }, { threshold: Array.from({ length: 101 }, (_, i) => i / 100) })
    warm.observe(element); observer.observe(element)
    const visibility = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { warm.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  const start = useCallback((item: DemoReply, automatic = false) => {
    if (run.current) return
    if (automatic) { if (pageSession.touched || pageSession.silenceShown) return; pageSession.silenceShown = true; track('demo_silence_shown', {}) }
    else { pageSession.touched = true; track('demo_chip_clicked', { chip: item.id as typeof DEMO_CHIPS[number]['id'] }) }
    setPaused(false)
    const replyId = ++sequence.current
    const next = { item, elapsed: automatic ? DEMO_TIMING.delayMs : 0, replyId }
    run.current = next; setReaction({ ...next }); setProgress(next.elapsed)
    setMessages(previous => [
      ...previous,
      ...(!automatic ? [{ id: ++sequence.current, speaker: 'self' as const, text: item.chip, visible: item.chip, complete: true }] : []),
      { id: replyId, speaker: 'mate', text: item.dialogue, visible: '', complete: false },
    ])
  }, [])

  useEffect(() => {
    if (!active) return
    let frame = 0, previous = performance.now(), lastBucket = -1
    const tick = (now: number) => {
      const delta = now - previous; previous = now
      if (!reduced) { connection.current += delta; setSeconds(Math.floor(connection.current / 1000)) }
      const current = run.current
      if (current) {
        current.elapsed += delta
        const schedule = demoTiming(current.item), elapsed = current.elapsed - DEMO_TIMING.delayMs
        const visible = elapsed < schedule.talkStartMs ? '' : reduced ? current.item.dialogue : textAt(current.item, elapsed - schedule.talkStartMs)
        const complete = elapsed >= schedule.talkEndMs || (reduced && elapsed >= schedule.talkStartMs)
        const bucket = Math.floor(current.elapsed / 33)
        if (bucket !== lastBucket) {
          lastBucket = bucket; setProgress(current.elapsed)
          setMessages(previousMessages => previousMessages.map(message => message.id === current.replyId && (message.visible !== visible || message.complete !== complete) ? { ...message, visible, complete } : message))
        }
        const encodedDuration = Math.ceil(schedule.durationMs / 1000 * 24) / 24 * 1000
        if (elapsed >= encodedDuration) { run.current = null; setReaction(null); setProgress(0) }
      } else if (halfVisible && !reduced && !pageSession.touched && !pageSession.silenceShown) {
        silenceClock.current += delta
        if (silenceClock.current >= DEMO_TIMING.silenceMs) start(DEMO_SILENCE, true)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, halfVisible, reduced, start])

  const bubble = (message: Message, overlay = false) => <div key={message.id} className={`talk-message talk-message--${message.speaker}${overlay ? ' talk-message--overlay' : ''}`} data-speaker={message.speaker} aria-hidden="true">
    {message.speaker === 'mate' && <span>채린</span>}<p>{message.visible}</p>
  </div>

  return <section className="talk-demo" id="talk" ref={section} aria-labelledby="talk-title" data-state={reaction ? reaction.item.id : 'idle'} data-phase={busy ? (localTime < (timing?.talkStartMs ?? 0) ? 'transition' : localTime < (timing?.talkEndMs ?? 0) ? 'talking' : 'hold') : 'idle'} data-expression={expression} data-view={media.view} data-frame-view={frameView} data-fallback={media.fallback} data-active={active}>
    <header className="talk-demo__heading"><h2 id="talk-title">채린에게 직접 말 걸어 보세요</h2><p>답장을 골라 보세요. 가만히 있으면 채린이 먼저 말을 걸어요.</p></header>
    <p className="sr-only">채린은 AI 캐릭터예요. 미리 만든 예시 반응을 보여 주는 데모예요.</p>
    <div className="sr-only" role="log" aria-live="polite" aria-relevant="additions" aria-label="채린과의 대화 기록">{messages.filter(message => message.complete).map(message => <p key={message.id}>{message.speaker === 'mate' ? '채린' : '나'}: {message.text}</p>)}</div>
    <div className="talk-demo__layout">
      <div className="talk-demo__stage" ref={frame}>
        <div className="talk-demo__visual" aria-hidden="true">
          {media.poster && <img className="talk-demo__poster" src={media.poster} alt="" width={tall ? 800 : 1280} height={tall ? 1000 : 800} />}
          {!reduced && [0, 1].map(index => <video key={index} ref={element => { media.videos.current[index] = element }} src={media.slots[index]?.blob} data-clip={media.slots[index]?.clip} data-front={media.front === index} muted playsInline preload="auto" loop={media.slots[index]?.clip === 'idle'} onLoadedData={() => media.prepare(index)} onSeeked={() => media.prepare(index)} onTimeUpdate={() => media.onTimeUpdate(index)} onError={media.onError} />)}
          {near && <img className="talk-demo__still" data-visible={reduced ? true : media.fallback} src={staticSource} alt="" width={tall ? 800 : 1280} height={tall ? 1000 : 800} />}
          <div className="talk-demo__meta"><span className="talk-demo__pill"><i />채린 · 연결 중 <b>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</b></span><span className="talk-demo__pill">AI 캐릭터</span></div>
          <div className="talk-demo__self"><CallIcon name="person" /><span>내 캠</span><small>카메라 꺼짐</small></div>
          {mobile && <div className="talk-demo__overlay">{overlayMessages.map(message => bubble(message, true))}</div>}
        </div>
        {!reduced && <button className="talk-demo__motion" type="button" aria-label={paused ? '데모 영상 재생' : '데모 영상 일시정지'} aria-pressed={paused} onClick={() => setPaused(value => !value)}><CallIcon name={paused ? 'play' : 'pause'} /><span>{paused ? '재생' : '일시정지'}</span></button>}
      </div>
      <div className="talk-demo__panel">
        <h3>채팅</h3>
        <div className="talk-demo__history-wrap">
          <div className="talk-demo__history" ref={historyRef} role="region" aria-label="대화 기록 스크롤" tabIndex={mobile ? -1 : 0} data-scrolled={scrolled} onScroll={onScroll} onWheel={stopJump} onPointerDown={stopJump} onKeyDown={stopJump}>{panelMessages.length ? panelMessages.map(message => bubble(message)) : <p className="talk-demo__empty" aria-hidden="true">채린이 연결됐어요.<br />먼저 한마디 건네 볼까요?</p>}</div>
          {unread && !mobile && <button className="talk-demo__latest" type="button" onClick={jumpToLatest}>새 메시지</button>}
        </div>
        <div className="talk-demo__chips" role="group" aria-label="채린에게 보낼 답장">{DEMO_CHIPS.map(item => <button key={item.id} type="button" data-chip={item.id} aria-disabled={busy} onClick={() => start(item)}>{item.chip}</button>)}</div>
        <div className="talk-demo__composer" aria-hidden="true"><span>채린에게 한마디…</span><CallIcon name="chat" /></div>
        <p className="talk-demo__beta">베타에서 직접 이야기할 수 있어요</p>
      </div>
    </div>
    <p className="talk-demo__note">실제 대화는 정해진 답이 아니라 AI가 자유롭게 이어가요.</p>
  </section>
}
