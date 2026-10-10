import smile from '../assets/hero/poster-1.webp'
import top from '../assets/story/room-select/top.webp'
import lantern from '../assets/hero/poster-2.webp'
import baekdojun from '../assets/hero/poster-6.webp'
import fenesis from '../assets/hero/poster-4.webp'
import jurassic from '../assets/story/gallery-jurassic.webp'
import cat from '../assets/story/gallery-cat.webp'
import lab from '../assets/rooms/poster-9.webp'
import capsule from '../assets/story/room-select/capsule.svg'
import search from '../assets/story/room-select/search.svg'
import check from '../assets/story/room-select/check.svg'
import camera from '../assets/story/room-select/camera.svg'
import './RoomSelectPreview.css'

const POSTERS = [
  { image: smile, tags: '', selected: true },
  { image: top, tags: '#라이벌 #시험기간' },
  { image: lantern, tags: '#군대 #연등' },
  { image: baekdojun, tags: '#여성향 #로맨스' },
  { image: fenesis, tags: '#판타지 #마법학교' },
  { image: jurassic, tags: '#공룡 #귀여움' },
  { image: cat, tags: '#고양이 #힐링' },
  { image: lab, tags: '#실험실 #귀여움' },
]

// Figma 1:177. The parent demonstration owns the interaction and clock.
export default function RoomSelectPreview({ selected = true }: { selected?: boolean }) {
  return (
    <div className="room-preview" aria-hidden="true">
      <div className="room-preview__topbar">
        <div className="room-preview__brand">
          <span className="room-preview__brand-mark">
            <span className="room-preview__capsule"><img src={capsule} alt="" /></span>
          </span>
          <span>CAPSULE</span>
        </div>
        <div className="room-preview__search">
          <span className="room-preview__icon room-preview__icon--search"><img src={search} alt="" /></span>
          <span>캐릭터, 세계관 검색</span>
        </div>
      </div>

      <div className="room-preview__content">
        <div className="room-preview__intro">
          <p className="room-preview__title">오늘은 누구랑<br />공부할까요?</p>
          <p className="room-preview__lead">스터디룸을 고르고 캠을 켜면,<br />캐릭터와 바로 같이 공부를<br />시작해요</p>
        </div>
        <div className="room-preview__grid">
          {POSTERS.map((poster) => (
            <div className={`room-preview__poster${poster.selected && selected ? ' room-preview__poster--selected' : ''}`} key={poster.image}>
              <img src={poster.image} alt="" />
              <span className="room-preview__shade"></span>
              {poster.selected && selected ? (
                <>
                  <span className="room-preview__badge">
                    <span className="room-preview__icon room-preview__icon--check"><img src={check} alt="" /></span>
                    선택됨
                  </span>
                  <span className="room-preview__enter">
                    <span className="room-preview__icon room-preview__icon--camera"><img src={camera} alt="" /></span>
                    스터디룸 입장하기
                  </span>
                </>
              ) : <span className="room-preview__tags">{poster.tags}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
