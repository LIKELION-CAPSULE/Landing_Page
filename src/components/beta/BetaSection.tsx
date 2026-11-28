import CallCta from '../hero/CallCta.tsx'
import { MATES } from '../../data/mates.ts'
import { PixelImage } from '../pixel/Pixel.tsx'
import { BETA_FACTS, FAQ, START_STEPS } from '../../data/beta.ts'
import { useCtaState } from '../../hooks/useCtaState.ts'
import './BetaSection.css'

export default function BetaSection() {
  const cta = useCtaState()
  return (
    <section className="beta" id="beta" aria-labelledby="beta-title">
      <header className="beta__heading" data-reveal>
        <p className="section-eyebrow"><PixelImage name="capsule" />웹 베타</p>
        <h2 id="beta-title">웹 베타에서 먼저 만나요</h2>
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
        <div className="beta-final__avatars" aria-hidden="true">{MATES.map(mate => <img key={mate.id} className="beta-final__avatar" src={mate.avatar} alt="" width={96} height={96} loading="lazy" decoding="async" draggable={false} />)}</div>
        <h3>나만의 메이트가 기다리고 있어요</h3>
        <p>노트북 앞의 시간을 채린, 서도현과 함께 보내요.</p>
        <CallCta placement="final" state={cta} />
        <small>웹 베타 · 무료 · 선착순 100명</small>
      </div>
    </section>
  )
}
