import { useEffect } from 'react'
import type { Room } from '../data/rooms.ts'
import type { PreorderReceipt } from '../data/preorder.ts'
import FunnelHeader from '../components/FunnelHeader.tsx'
import bubbleTail from '../assets/done/bubble-tail.svg'

const INSTAGRAM_URL = 'https://www.instagram.com/capsule.studywithme/'

type Props = {
  receipt: PreorderReceipt | null
  votedRoom: Room | null
  onEdit: () => void
  onOpenPreorder: () => void
  onRestart: () => void
}

function maskEmail(email: string) {
  const at = email.lastIndexOf('@')
  return `${email.slice(0, Math.min(2, Math.max(1, at - 1)))}***${email.slice(at)}`
}

export default function DonePage({ receipt, votedRoom, onEdit, onOpenPreorder, onRestart }: Props) {
  const duplicate = receipt?.status === 'duplicate'
  useEffect(() => {
    const previous = document.title
    document.title = `${receipt && votedRoom ? duplicate ? '이미 사전예약한 이메일' : '사전예약 완료' : '사전예약 안내'} · 캡슐 CAPSULE`
    return () => {
      document.title = previous
    }
  }, [receipt, votedRoom, duplicate])

  if (!receipt || !votedRoom) {
    return (
      <main className="done done--empty">
        <FunnelHeader current={3} onBack={onOpenPreorder} backLabel="사전예약 입력으로 돌아가기" />
        <header className="done__header">
          <h1 className="done__title"><span>예약 완료 정보를</span><span>확인할 수 없어요</span></h1>
          <p className="done__lead">룸을 선택하고 예약 정보를 입력해주세요.</p>
        </header>
        <div className="done__notice">
          새로고침하거나 새 창으로 열면 이 화면의 완료 정보를 볼 수 없어요.
          이미 접수한 사전예약은 그대로 유지돼요.
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
      <FunnelHeader current={3} onBack={onEdit} backLabel="사전예약 화면으로 돌아가기" />
      <header className="done__header">
        <h1 className="done__title">
          {duplicate ? <><span>이미 사전예약한</span><span>이메일이에요</span></> : <><span>사전예약이</span><span>완료됐어요!</span></>}
        </h1>
        <p className="done__lead">출시되면 이메일로 가장 먼저 알려드릴게요.</p>
      </header>

      <div className="done__email">
        <p>출시 알림을 받을 이메일</p>
        <strong><bdi>{maskEmail(receipt.email)}</bdi></strong>
        <p className="done__email-note">{duplicate ? '기존 예약 정보와 혜택은 변경되지 않았어요.' : '이 주소로 출시 소식과 사전예약 혜택을 보내드려요.'}</p>
        <button type="button" className="text-action" id="done-edit" onClick={onEdit}>다른 이메일로 사전예약하기</button>
      </div>

      {!duplicate && <div className="done__perk">
        <p className="done__perk-label">사전예약 혜택 · 투표한 룸 무료 해금</p>
        <p className="done__perk-room">선택한 룸: {votedRoom.name}</p>
        <p className="done__perk-note">해당 룸이 출시될 경우 제공돼요.</p>
      </div>}

      {!duplicate && <div className="done__stage">
        <div className="done__poster">
          <img src={votedRoom.image} alt={votedRoom.name} />
        </div>

        <div className="done__bubble" aria-hidden="true">
          <img className="done__bubble-tail" src={bubbleTail} alt="" width={26.8468} height={22.5} />
          <span className="done__bubble-body"></span>
          <p className="done__bubble-text">우리가 만날<br />미래에서 기다릴게</p>
          <span className="done__bubble-haze"></span>
        </div>
      </div>}

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
