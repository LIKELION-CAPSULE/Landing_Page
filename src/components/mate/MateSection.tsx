import { useEffect, useRef } from 'react'
import portrait from '../../assets/mates/chaerin/chaerin-v2-hero.webp'
import { CHAERIN_PROFILE as profile } from '../../data/chaerin-profile.ts'
import { track } from '../../lib/analytics.ts'
import './MateSection.css'

// Report each card once, when half of it has been on screen.
function useViewedOnce(mate: 'chaerin' | 'upcoming') {
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

export default function MateSection() {
  const chaerin = useViewedOnce('chaerin')
  const upcoming = useViewedOnce('upcoming')
  return (
    <section className="mate" id="mates" aria-labelledby="mate-title">
      <header className="mate__heading" data-reveal>
        <h2 id="mate-title">오늘 연결할 메이트</h2>
      </header>

      <article ref={chaerin} className="mate-card" aria-labelledby="mate-chaerin-name" data-reveal>
        <div className="mate-card__visual">
          <img src={portrait} alt="강채린. 허리까지 오는 백금발에 흰 셔츠와 느슨한 검은 넥타이 차림의 AI 캐릭터" width={1520} height={1800} loading="lazy" decoding="async" draggable={false} />
          <ul className="mate-card__badges" aria-label="메이트 정보">
            <li>{profile.rating}</li>
            <li>AI 캐릭터</li>
          </ul>
        </div>

        <div className="mate-card__info">
          <h3 id="mate-chaerin-name">{profile.name}</h3>
          <p className="mate-card__summary">{profile.summary}</p>

          <dl className="mate-card__facts">
            <div><dt>내 역할</dt><dd>{profile.role}</dd></div>
            <div><dt>시작 상황</dt><dd>{profile.situation}</dd></div>
          </dl>

          <blockquote className="mate-card__first-line">
            <span>첫 대사</span>
            <p>“{profile.firstLine}”</p>
          </blockquote>

          <dl className="mate-card__taste">
            <div><dt>좋아해요</dt><dd>{profile.likes}</dd></div>
            <div><dt>싫어해요</dt><dd>{profile.dislikes}</dd></div>
          </dl>

          <ul className="mate-card__tags" aria-label="해시태그">
            {profile.tags.map(tag => <li key={tag}>#{tag}</li>)}
          </ul>
        </div>
      </article>

      <aside ref={upcoming} className="mate-next" aria-labelledby="mate-next-title" data-reveal>
        <span className="mate-next__silhouette" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="24" r="12" /><path d="M10 60c0-14 10-22 22-22s22 8 22 22z" /></svg>
          <b>?</b>
        </span>
        <div>
          <h3 id="mate-next-title">두 번째 메이트</h3>
          <p>곧 만나요. 새 메이트가 준비되고 있어요.</p>
        </div>
      </aside>
    </section>
  )
}
