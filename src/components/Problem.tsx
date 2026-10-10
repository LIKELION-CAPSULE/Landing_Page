import introCharacter from '../assets/optimized/story/intro-character.webp'
import bubbleTail from '../assets/story/bubble-tail.svg'

export default function Problem() {
  return (
    <section className="problem" id="problem" aria-labelledby="problem-title">
      <div className="problem__blur" aria-hidden="true"></div>
      <p className="problem__eyebrow" data-reveal>혹시 이런 순간, 익숙하신가요?</p>
      <h2 className="problem__title" id="problem-title" data-reveal>
        <span>혼자서 공부,</span>
        <span className="accent">30분도 못 버티죠?</span>
      </h2>

      <div className="problem__character" aria-hidden="true">
        <img src={introCharacter} alt="" loading="lazy" decoding="async" width={1024} height={1536} />
      </div>
      <div className="problem__fade problem__fade--bottom" aria-hidden="true"></div>
      <div className="problem__fade problem__fade--top" aria-hidden="true"></div>

      <p className="problem__question" data-reveal>그럼, 캡슐은 <span className="accent">어떻게 다를까요?</span></p>

      <p className="chip chip--1" data-reveal>혼자 앉아 있으면,<br />어느새 폰에 손이 가요.</p>
      <p className="chip chip--2" data-reveal><span className="chip__glow" aria-hidden="true"></span>스터디위드미 영상은<br />나를 보고 반응하지 않아요.</p>
      <p className="chip chip--3" data-reveal><span className="chip__glow" aria-hidden="true"></span>디코 모각공은 시간을 맞춰야하고,<br />함께 켜도 수다로 새요.</p>

      <div className="speech" data-reveal>
        <span className="speech__glow" aria-hidden="true"></span>
        <span className="speech__tail" aria-hidden="true"><img src={bubbleTail} alt="" /></span>
        <span className="speech__body" aria-hidden="true"></span>
        <p className="speech__text">괜찮아!<br />이제 나랑 같이 하자.</p>
      </div>
    </section>
  )
}
