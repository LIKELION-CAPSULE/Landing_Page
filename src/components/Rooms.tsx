import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { ROUTES } from '../hooks/useRoute.ts'
import { track } from '../lib/analytics.ts'
import galleryIljin from '../assets/optimized/rooms/poster-8.webp'
import galleryJurassic from '../assets/optimized/story/gallery-jurassic.webp'
import galleryLantern from '../assets/optimized/hero/poster-2.webp'
import galleryGirls from '../assets/optimized/story/gallery-three-girls.webp'
import galleryMid from '../assets/optimized/story/gallery-mid-b.webp'
import galleryJoseon from '../assets/optimized/rooms/joseon.webp'
import galleryLab from '../assets/optimized/rooms/poster-9.webp'
import galleryFenesis from '../assets/optimized/story/gallery-fenesis.webp'
import galleryCat from '../assets/optimized/story/gallery-cat.webp'
import shade from '../assets/story/gallery-shade.svg'
import ctaArrow from '../assets/story/cta-arrow.svg'

const GAP = 15

type Lane = {
  side: 'left' | 'mid' | 'right'
  cards: { image: string; crop?: 'jurassic' | 'fenesis' | 'cat' | 'lantern' | 'lab'; height?: number }[]
  cardHeight: number
  // Design px per second. The middle lane drifts slower for a bit of depth.
  speed: number
  // Where the first card's top sits at t = 0, matching the Figma layout.
  offset: number
}

// The first visible cards and crops follow Figma's landing gallery.
const LANES: Lane[] = [
  { side: 'left', cardHeight: 146, speed: 20, offset: 32, cards: [{ image: galleryIljin }, { image: galleryJurassic, crop: 'jurassic' }, { image: galleryLantern, crop: 'lantern' }] },
  { side: 'mid', cardHeight: 200, speed: 14, offset: 11, cards: [{ image: galleryGirls, height: 201 }, { image: galleryJoseon, height: 201 }, { image: galleryMid }] },
  { side: 'right', cardHeight: 146, speed: 20, offset: 33, cards: [{ image: galleryLab, crop: 'lab' }, { image: galleryFenesis, crop: 'fenesis' }, { image: galleryCat, crop: 'cat' }] },
]

// Lanes are 500 tall; the track needs at least that plus one cycle so the
// loop seam is never on screen.
const LANE_HEIGHT = 500

function laneStyle({ cards, cardHeight, speed, offset }: Lane) {
  const cycle = cards.reduce((height, card) => height + (card.height ?? cardHeight) + GAP, 0)
  const copies = Math.ceil(LANE_HEIGHT / cycle) + 1
  const style = {
    '--cycle': `calc(${cycle} * var(--u))`,
    '--offset': `calc(${offset} * var(--u))`,
    '--duration': `${cycle / speed}s`,
    '--delay': `${-offset / speed}s`,
  } as CSSProperties
  return { style, copies }
}

type Props = {
  onOpenRooms: () => void
}

export default function Rooms({ onOpenRooms }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)
  const [loadImages, setLoadImages] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let visible = false
    const update = () => section.toggleAttribute('data-active', visible && !document.hidden)
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    if (observer) observer.observe(section)
    else { visible = true; update() }
    const preparation = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoadImages(true)
        preparation?.disconnect()
      }
    }, { rootMargin: '300px' })
    preparation?.observe(section)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer?.disconnect()
      preparation?.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  // Let modified clicks (new tab, etc.) fall through to the real link.
  const handleCtaClick = (event: MouseEvent<HTMLAnchorElement>) => {
    track('cta_clicked', { cta: 'open_rooms', path: '/' })
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    onOpenRooms()
  }

  return (
    <section className="rooms" aria-label="다른 스터디룸" ref={sectionRef} data-paused={paused || undefined} data-reveal>
      {LANES.map((lane) => {
        const { style, copies } = laneStyle(lane)
        return (
          <div className={`rooms__lane rooms__lane--${lane.side}`} key={lane.side} aria-hidden="true">
            <div className="rooms__track" style={style}>
              {Array.from({ length: copies }, (_, copy) =>
                lane.cards.map((card, i) => (
                  <div className={`rooms__card${card.crop ? ` rooms__card--${card.crop}` : ''}`} key={`${copy}-${i}`} style={{ height: `calc(${card.height ?? lane.cardHeight} * var(--u))` }}>
                    {loadImages && <img src={card.image} alt="" decoding="async" />}
                  </div>
                )),
              )}
            </div>
          </div>
        )
      })}
      <img className="rooms__shade" src={shade} alt="" aria-hidden="true" />
      <div className="rooms__fade" aria-hidden="true"></div>
      <button type="button" className="rooms__motion-toggle" aria-label={paused ? '포스터 애니메이션 재생' : '포스터 애니메이션 일시정지'} onClick={() => setPaused(current => !current)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          {paused ? <path d="m9 5 10 7-10 7V5Z" fill="currentColor" /> : <path d="M8 6v12M16 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </svg>
      </button>
      <a className="cta" href={ROUTES.rooms} onClick={handleCtaClick}>
        <span>다른 스터디룸 구경하고 투표하기</span>
        <img className="cta__arrow" src={ctaArrow} alt="" width={24} height={24} />
      </a>
    </section>
  )
}
