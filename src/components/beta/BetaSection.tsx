import { useEffect, useState } from 'react'
import CallCta from '../hero/CallCta.tsx'
import avatar from '../../assets/mates/chaerin/avatar.webp'
import { BETA_FACTS, FAQ, START_STEPS } from '../../data/beta.ts'
import { ctaState, MOBILE_QUERY, OPEN_AT, type CtaState } from '../../lib/cta.ts'
import './BetaSection.css'

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

// Same rule as the hero (lib/cta.ts): before 12/1 → before_open; after → open only if VITE_APP_URL is set.
function useCtaState(): CtaState {
  const [cta, setCta] = useState(ctaState)
  useEffect(() => {
    const update = () => setCta(ctaState())
    const timer = window.setTimeout(update, Math.min(Math.max(OPEN_AT - Date.now(), 0), 2_147_483_647))
    document.addEventListener('visibilitychange', update)
    window.addEventListener('popstate', update)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', update)
      window.removeEventListener('popstate', update)
    }
  }, [])
  return cta
}

export default function BetaSection() {
  const cta = useCtaState()
  const mobile = useMedia(MOBILE_QUERY)
  return (
    <section className="beta" id="beta" aria-labelledby="beta-title">
      <header className="beta__heading" data-reveal>
        <h2 id="beta-title">12월 1일, 채린과 먼저 만나요</h2>
        <p>웹 베타는 2주 동안, 100명과 먼저 열어요.</p>
      </header>

      <dl className="beta-facts" data-reveal>
        {BETA_FACTS.map(fact => (
          <div key={fact.label} className="beta-fact">
            <dt>{fact.label}</dt>
            <dd><strong>{fact.value}</strong></dd>
          </div>
        ))}
      </dl>

      <div className="beta__columns">
        <div className="beta-start" data-reveal>
          <h3>시작은 이렇게</h3>
          <ol>
            {START_STEPS.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">{index + 1}</span>
                <div><strong>{step.title}</strong><p>{step.body}</p></div>
              </li>
            ))}
          </ol>
        </div>

        <div className="beta-faq" data-reveal>
          <h3>궁금한 점</h3>
          {FAQ.map(item => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="beta-final" data-reveal>
        <img className="beta-final__avatar" src={avatar} alt="" width={1024} height={1024} loading="lazy" decoding="async" draggable={false} />
        <h3>나만의 메이트가 기다리고 있어요</h3>
        <p>노트북 앞의 시간을 채린과 함께 보내요.</p>
        <CallCta placement="final" state={cta} mobile={mobile} />
        <small>웹 베타 · 무료 · 선착순 100명</small>
      </div>
    </section>
  )
}
