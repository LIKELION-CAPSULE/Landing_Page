import { useEffect } from 'react'
import type { Room } from '../data/rooms.ts'
import type { PreorderReview } from '../data/preorder.ts'
import FunnelHeader from '../components/FunnelHeader.tsx'
import bubbleTail from '../assets/done/bubble-tail.svg'

const INSTAGRAM_URL = 'https://www.instagram.com/capsule.studywithme/'

type Props = {
  review: PreorderReview | null
  votedRoom: Room | null
  onEdit: () => void
  onOpenPreorder: () => void
  onRestart: () => void
}

function maskEmail(email: string) {
  const at = email.lastIndexOf('@')
  return `${email.slice(0, Math.min(2, Math.max(1, at - 1)))}***${email.slice(at)}`
}

export default function DonePage({ review, votedRoom, onEdit, onOpenPreorder, onRestart }: Props) {
  useEffect(() => {
    const previous = document.title
    document.title = `${review && votedRoom ? '사전예약 입력 확인' : '사전예약 안내'} · 캡슐 CAPSULE`
    return () => {
      document.title = previous
    }
  }, [review, votedRoom])

  if (!review || !votedRoom) {
    return (
      <main className="done done--empty">
        <FunnelHeader current={3} onBack={onOpenPreorder} backLabel="사전예약 입력으로 돌아가기" />
        <header className="done__header">
          <h1 className="done__title"><span>아직 확인한</span><span>입력이 없어요</span></h1>
          <p className="done__lead">룸을 선택하고 예약 정보를 입력해주세요.</p>
        </header>
        <div className="done__notice">
          새로고침하거나 새 창으로 열면 입력 확인 내용을 볼 수 없어요.
          사전예약 정보는 아직 전송되지 않았어요.
        </div>
        <div className="done__actions">
          <button type="button" className="done__button done__button--primary" id="done-open-preorder" onClick={onOpenPreorder}>사전예약 입력하기</button>
          <button type="button" className="done__button done__button--outline" onClick={onRestart}>처음으로 돌아가기</button>
        </div>
      </main>
    )
  }

  return (
    <main className="done">
      {/* 7. Pre-registration done (Figma 160:571) */}
      <FunnelHeader current={3} onBack={onEdit} backLabel="입력 수정으로 돌아가기" />
      <header className="done__header">
        <h1 className="done__title"><span>입력 내용을</span><span>확인했어요</span></h1>
        <p className="done__lead">사전예약은 아직 접수되지 않았어요.</p>
      </header>

      <div className="done__email">
        <p>확인한 이메일</p>
        <strong><bdi>{maskEmail(review.email)}</bdi></strong>
        <p className="done__email-note">예약 정보가 전송되지 않았어요.</p>
        <button type="button" className="text-action" id="done-edit" onClick={onEdit}>입력 수정하기</button>
      </div>

      <div className="done__perk">
        <p className="done__perk-label">사전예약 혜택 · 투표한 룸 무료 해금</p>
        <p className="done__perk-room">선택한 룸: {votedRoom.name}</p>
        <p className="done__perk-note">사전예약 후, 해당 룸이 출시될 경우 제공돼요.</p>
      </div>

      <div className="done__stage">
        <div className="done__poster">
          <img src={votedRoom.image} alt={votedRoom.name} />
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
