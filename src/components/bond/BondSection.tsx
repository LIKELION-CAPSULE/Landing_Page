import { AFFINITY_STAGES, episodeLabel, RECORD_FEATURES, WORLD_POINTS } from '../../data/bond.ts'
import { PixelImage } from '../pixel/Pixel.tsx'
import './BondSection.css'

// S5: intimacy stages open the mate's worlds (세계관), one per stage. Structure only (user decision
// 2026-11-28): no world names or background pictures until the app ships them.
export default function BondSection() {
  return (
    <section className="bond" id="bond" aria-labelledby="bond-title">
      <header className="bond__heading" data-reveal>
        <p className="section-eyebrow"><PixelImage name="heart" />친밀도 · 세계관</p>
        <h2 id="bond-title">함께한 시간만큼,<br />새 세계관이 열려요</h2>
        <p>연결하고 대화할수록 메이트와 가까워져요. 친밀도 단계가 오를 때마다 메이트의 세계관이 하나씩 열려요.</p>
      </header>

      <ol className="bond-track" aria-label="친밀도 단계와 열리는 세계관" data-reveal>
        {AFFINITY_STAGES.map(item => (
          <li key={item.stage} className="bond-stage">
            <span className="bond-stage__lv"><span className="px-tile" aria-hidden="true"><PixelImage digit={item.stage} /></span><span className="sr-only">{item.stage}단계</span></span>
            <strong className="bond-stage__name">{item.name}</strong>
            <span className="bond-stage__world">
              <span className="bond-stage__ep">{episodeLabel(item.stage)} 세계관</span>
              <span className="bond-stage__when">{item.world}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="bond-world" data-reveal>
        <div className="bond-world__copy">
          <h3>세계관은 메이트와 만나는 장소예요</h3>
          <p>메이트의 성격은 그대로예요. 장소가 바뀌면 배경과 옷차림, 나누는 이야기가 달라져요.</p>
        </div>
        <ul className="bond-world__points">
          {WORLD_POINTS.map(point => <li key={point.title}><strong>{point.title}</strong><span>{point.body}</span></li>)}
        </ul>
      </div>
      <p className="bond__rule" data-reveal>친밀도는 함께한 시간과 대화로만 올라요. 결제로는 올릴 수 없어요.</p>

      <div className="records" id="records" aria-labelledby="records-title">
        <h3 id="records-title" className="records__title" data-reveal>함께한 시간은 기록으로 남아요</h3>
        <ul className="records__list" data-reveal>
          {RECORD_FEATURES.map(feature => (
            <li key={feature.title} className="px-card records-card">
              <span className="px-tile" aria-hidden="true"><PixelImage name={feature.icon} scale={feature.icon === 'capsule' ? 1.4 : 2} /></span>
              <h4>{feature.title}</h4>
              <p>{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
