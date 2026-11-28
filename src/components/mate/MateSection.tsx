import { useEffect, useRef } from 'react'
import { MATES, type LandingMate, type MateId } from '../../data/mates.ts'
import { track } from '../../lib/analytics.ts'
import { PixelImage, PixelRoof } from '../pixel/Pixel.tsx'
import './MateSection.css'

// Report each card once, when half of it has been on screen.
function useViewedOnce(mate: MateId) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < .5) return
      track('mate_card_viewed', { mate })
      observer.disconnect()
    }, { threshold: .5 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [mate])
  return ref
}

function MateCard({ mate }: { mate: LandingMate }) {
  const ref = useViewedOnce(mate.id)
  const titleId = `mate-${mate.id}-name`
  return (
    <article ref={ref} id={mate.id} className="mate-card" aria-labelledby={titleId} data-mate={mate.id} data-reveal>
      <PixelRoof />
      <div className="mate-card__visual">
        <img src={mate.hero} alt={mate.heroAlt} width={1520} height={1800} loading="lazy" decoding="async" draggable={false} />
        <ul className="mate-card__badges" aria-label="메이트 정보">
          <li>{mate.rating}</li>
          <li>AI 캐릭터</li>
        </ul>
      </div>

      <div className="mate-card__info">
        <h3 id={titleId}>{mate.fullName}</h3>
        <p className="mate-card__summary">{mate.introduction}</p>

        <dl className="mate-card__facts">
          <div><dt>내 역할</dt><dd>{mate.role}</dd></div>
          <div><dt>시작 상황</dt><dd>{mate.situation}</dd></div>
        </dl>

        <blockquote className="mate-card__first-line">
          <span>첫 대사</span>
          <p>“{mate.firstLine}”</p>
        </blockquote>

        {mate.likes && mate.dislikes && (
          <dl className="mate-card__taste">
            <div><dt>좋아해요</dt><dd>{mate.likes}</dd></div>
            <div><dt>싫어해요</dt><dd>{mate.dislikes}</dd></div>
          </dl>
        )}

        <ul className="mate-card__tags" aria-label="관계">
          {mate.tags.map(tag => <li key={tag}>#{tag.replace(/\s+/g, '')}</li>)}
        </ul>
      </div>
    </article>
  )
}

export default function MateSection() {
  return (
    <section className="mate" id="mates" aria-labelledby="mate-title">
      <header className="mate__heading" data-reveal>
        <p className="section-eyebrow"><PixelImage name="capsule" />메이트 소개</p>
        <h2 id="mate-title">오늘 연결할 메이트</h2>
        <p>베타에서는 두 메이트와 연결할 수 있어요. 둘 다 전연령이에요.</p>
      </header>
      <div className="mate__list">
        {MATES.map(mate => <MateCard key={mate.id} mate={mate} />)}
      </div>
    </section>
  )
}
