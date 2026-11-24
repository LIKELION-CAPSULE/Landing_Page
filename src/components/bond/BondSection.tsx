import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BOND_STAGES, EPISODES, type Episode } from '../../data/chaerin-profile.ts'
import CallIcon from '../hero/CallIcon.tsx'
import lockedPortrait from '../../assets/mates/chaerin/neutral.webp'
import './BondSection.css'

const STEP_MS = 3200

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}
const lock = <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>
const episodeIcons: Record<Episode['icon'], ReactNode> = {
  rain: <><path d="M20 15.5A4.5 4.5 0 0 0 17.5 7a6 6 0 0 0-11.6 1.6A4 4 0 0 0 6 16.5h12" /><path d="M8 19v2m4-3v2m4-1v2" /></>,
  paper: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  keyring: <><circle cx="8" cy="8" r="5" /><path d="m11.5 11.5 3 3m0 0 2.5-1 3 3-1 2.5-3-3z" /></>,
}

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

export default function BondSection() {
  const portrait = useRef<HTMLDivElement>(null)
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const [active, setActive] = useState(0)
  const [inView, setInView] = useState(false)
  const [tabVisible, setTabVisible] = useState(() => !document.hidden)
  const [manual, setManual] = useState(false)
  const [paused, setPaused] = useState(false)
  const stage = BOND_STAGES[active]
  const stopped = manual || paused
  const cycling = inView && tabVisible && !stopped && !reduced

  useEffect(() => {
    // Same rule as S4 scenes: advance only while half of the changing portrait is on screen.
    const element = portrait.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting && entry.intersectionRatio >= .5)
    }, { threshold: [0, .5, 1] })
    observer.observe(element)
    const visibility = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  useEffect(() => {
    if (!cycling) return
    const timer = window.setTimeout(() => setActive(index => (index + 1) % BOND_STAGES.length), STEP_MS)
    return () => window.clearTimeout(timer)
  }, [cycling, active])

  const choose = (index: number) => { setManual(true); setActive(index) }
  const toggle = () => { if (stopped) { setManual(false); setPaused(false) } else setPaused(true) }

  return (
    <section className="bond" id="bond" aria-labelledby="bond-title" data-cycling={cycling}>
      <header className="bond__heading" data-reveal>
        <h2 id="bond-title">함께한 시간만큼,<br />새 에피소드가 열려요</h2>
        <p>처음엔 쌀쌀맞던 채린이, 함께한 시간과 대화가 쌓일수록 먼저 장난을 걸어요.</p>
      </header>

      <div className="bond__body" data-reveal>
        <figure className="bond-stage">
          <div ref={portrait} className="bond-stage__portrait">
            {BOND_STAGES.map((item, index) => (
              <img
                key={item.id}
                src={item.image ?? lockedPortrait}
                alt=""
                draggable={false}
                data-locked={item.image ? undefined : ''}
                data-current={index === active ? '' : undefined}
                loading="lazy"
                decoding="async"
              />
            ))}
            {!stage.image && <span className="bond-stage__lock" aria-hidden="true"><Icon size={28}>{lock}</Icon></span>}
            <span className="bond-stage__badge" aria-hidden="true">{stage.name}</span>
            <span className="bond-stage__ai">AI 캐릭터</span>
            {!reduced && (
              <button type="button" className="bond-stage__control" aria-label={stopped ? '단계 자동 넘김 재생' : '단계 자동 넘김 일시정지'} onClick={toggle}>
                <CallIcon name={stopped ? 'play' : 'pause'} />
              </button>
            )}
          </div>
          {/* Announce only lines the visitor chose; automatic advances stay quiet. */}
          <figcaption id="bond-line" className="bond-stage__line" aria-live={manual ? 'polite' : 'off'} aria-atomic="true" data-locked={stage.image ? undefined : ''}>
            <span className="sr-only">{stage.name} 단계, </span>
            <span>채린</span>
            <p key={stage.id}>{stage.line}</p>
          </figcaption>
        </figure>

        <div className="bond__track">
          <ol className="bond-steps" aria-label="친밀도 단계">
            {BOND_STAGES.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="bond-step"
                  aria-pressed={index === active}
                  aria-controls="bond-line"
                  data-locked={item.image ? undefined : ''}
                  data-passed={index < active ? '' : undefined}
                  onClick={() => choose(index)}
                >
                  <span className="bond-step__dot" aria-hidden="true">{item.image ? index + 1 : <Icon size={14}>{lock}</Icon>}</span>
                  <span className="bond-step__text">
                    <strong>{item.name}</strong>
                    <span>{item.unlock}{item.image ? '' : ' · 잠김'}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="bond__rule">친밀도는 함께한 시간과 대화로만 올라요. 결제로는 올릴 수 없어요.</p>
        </div>
      </div>

      <div className="bond-episodes" data-reveal>
        <h3>열리는 에피소드 <span>예시</span></h3>
        <ul>
          {EPISODES.map(episode => (
            <li key={episode.id} className="bond-episode">
              <span className="bond-episode__icon"><Icon size={22}>{episodeIcons[episode.icon]}</Icon></span>
              <strong>{episode.title}</strong>
              <span className="bond-episode__condition"><Icon size={14}>{lock}</Icon>{episode.condition}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
