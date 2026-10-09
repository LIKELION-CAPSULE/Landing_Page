import { useState, type CSSProperties, type MouseEvent } from 'react'
import { ROUTES } from '../hooks/useRoute.ts'
import { ROOMS } from '../data/rooms.ts'
import shade from '../assets/story/gallery-shade.svg'
import ctaArrow from '../assets/story/cta-arrow.svg'

const GAP = 15

type Lane = {
  side: 'left' | 'mid' | 'right'
  images: string[]
  cardHeight: number
  // Design px per second. The middle lane drifts slower for a bit of depth.
  speed: number
  // Where the first card's top sits at t = 0, matching the Figma layout.
  offset: number
}

const LANE_SPECS: Omit<Lane, 'images'>[] = [
  { side: 'left', cardHeight: 146, speed: 20, offset: 32 },
  { side: 'mid', cardHeight: 200, speed: 14, offset: 11 },
  { side: 'right', cardHeight: 146, speed: 20, offset: 33 },
]

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Every room appears exactly once across the reel, in a fresh random
// order on each visit, dealt round-robin so the lanes stay even.
function dealLanes(): Lane[] {
  const images = shuffle(ROOMS.map((room) => room.image))
  return LANE_SPECS.map((spec, lane) => ({
    ...spec,
    images: images.filter((_, i) => i % LANE_SPECS.length === lane),
  }))
}

// Lanes are 500 tall; the track needs at least that plus one cycle so the
// loop seam is never on screen.
const LANE_HEIGHT = 500

function laneStyle({ images, cardHeight, speed, offset }: Lane) {
  const cycle = images.length * (cardHeight + GAP)
  const copies = Math.ceil(LANE_HEIGHT / cycle) + 1
  const style = {
    '--cycle': `calc(${cycle} * var(--u))`,
    '--duration': `${cycle / speed}s`,
    '--delay': `${-offset / speed}s`,
  } as CSSProperties
  return { style, copies }
}

type Props = {
  onOpenRooms: () => void
}

export default function Rooms({ onOpenRooms }: Props) {
  const [lanes] = useState(dealLanes)

  // Let modified clicks (new tab, etc.) fall through to the real link.
  const handleCtaClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    onOpenRooms()
  }

  return (
    <section className="rooms" aria-label="다른 스터디룸" data-reveal>
      {lanes.map((lane) => {
        const { style, copies } = laneStyle(lane)
        return (
          <div className={`rooms__lane rooms__lane--${lane.side}`} key={lane.side} aria-hidden="true">
            <div className="rooms__track" style={style}>
              {Array.from({ length: copies }, (_, copy) =>
                lane.images.map((src, i) => (
                  <img className="rooms__card" key={`${copy}-${i}`} src={src} alt="" />
                )),
              )}
            </div>
          </div>
        )
      })}
      <img className="rooms__shade" src={shade} alt="" aria-hidden="true" />
      <div className="rooms__fade" aria-hidden="true"></div>
      <a className="cta" href={ROUTES.rooms} onClick={handleCtaClick}>
        <span>다른 스터디룸 구경하고 투표하기</span>
        <img className="cta__arrow" src={ctaArrow} alt="" width={24} height={24} />
      </a>
    </section>
  )
}
