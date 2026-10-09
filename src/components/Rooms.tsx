import col1Top from '../assets/story/gallery-col1-top.png'
import slot from '../assets/story/gallery-slot.svg'
import fenesis from '../assets/story/gallery-fenesis.png'
import midA from '../assets/story/gallery-mid-a.png'
import midB from '../assets/story/gallery-mid-b.png'
import shade from '../assets/story/gallery-shade.svg'
import threeGirls from '../assets/story/gallery-three-girls.png'
import cat from '../assets/story/gallery-cat.png'
import alien from '../assets/story/gallery-alien.png'
import jurassic from '../assets/story/gallery-jurassic.png'
import ctaArrow from '../assets/story/cta-arrow.svg'

export default function Rooms() {
  return (
    <section className="rooms" aria-label="다른 스터디룸" data-reveal>
      <div className="rooms__col rooms__col--left" aria-hidden="true">
        <img src={col1Top} alt="" width={108} height={146} />
        <img src={slot} alt="" />
        <img src={slot} alt="" />
      </div>
      <div className="rooms__col rooms__col--right" aria-hidden="true">
        <img src={slot} alt="" />
        <img src={slot} alt="" />
        <img src={slot} alt="" />
        <div className="room room--fenesis"><img src={fenesis} alt="" /></div>
      </div>
      <div className="rooms__mid" aria-hidden="true">
        <div className="rooms__blank"></div>
        <div className="rooms__stack">
          <img src={midA} alt="" />
          <img src={midB} alt="" />
        </div>
      </div>
      <div className="rooms__mask rooms__mask--left" aria-hidden="true"></div>
      <div className="rooms__mask rooms__mask--right" aria-hidden="true"></div>
      <img className="rooms__shade" src={shade} alt="" aria-hidden="true" />
      <div className="room room--girls"><img src={threeGirls} alt="미소로 바뀐 교실 속 세 소녀" /></div>
      <div className="room room--cat"><img src={cat} alt="냥냥이 때문에 공부가 안 돼!" /></div>
      <div className="rooms__fade" aria-hidden="true"></div>
      <a className="cta" href="#">
        <span>다른 스터디룸 구경하고 투표하기</span>
        <img className="cta__arrow" src={ctaArrow} alt="" width={24} height={24} />
      </a>
      <div className="room room--alien"><img src={alien} alt="외계인들의 쿵캉쿵캉 실험실" /></div>
      <div className="room room--jurassic"><img src={jurassic} alt="쥬라기 독서실의 따뜻한 공부 시간" /></div>
    </section>
  )
}
