import { useEffect } from 'react'
import type { Room } from '../data/rooms.ts'
import bubbleTail from '../assets/done/bubble-tail.svg'

const INSTAGRAM_URL = 'https://www.instagram.com/capsule.studywithme/'

type Props = {
  votedRoom: Room | null
  onRestart: () => void
}

export default function DonePage({ votedRoom, onRestart }: Props) {
  useEffect(() => {
    const previous = document.title
    document.title = '사전예약 완료 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <main className="done">
      {/* 7. Pre-registration done (Figma 160:571) */}
      <header className="done__header">
        <h1 className="done__title">사전예약 완료!</h1>
        <p className="done__lead">출시되면 이메일로 가장 먼저 알려드릴게요.</p>
      </header>

      <div className="done__perk">
        <p className="done__perk-label">무료 해금 예정</p>
        <p className="done__perk-room">선택한 룸: {votedRoom ? votedRoom.name : '아직 고르지 않았어요'}</p>
        <p className="done__perk-note">해당 룸이 출시될 경우 제공돼요.</p>
      </div>

      <div className="done__stage">
        <div className="done__poster">
          {votedRoom && <img src={votedRoom.image} alt={votedRoom.name} />}
        </div>

        <div className="done__bubble" aria-hidden="true">
          <img className="done__bubble-tail" src={bubbleTail} alt="" width={26.8468} height={22.5} />
          <span className="done__bubble-body"></span>
          <p className="done__bubble-text">우리가 만날<br />미래에서 기다릴게</p>
          <span className="done__bubble-haze"></span>
        </div>
      </div>

      <div className="done__actions">
        <a className="done__button done__button--primary" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          인스타그램에서 캐릭터 구경하기
        </a>
        <button type="button" className="done__button done__button--outline" onClick={onRestart}>
          처음으로 돌아가기
        </button>
      </div>
    </main>
  )
}
