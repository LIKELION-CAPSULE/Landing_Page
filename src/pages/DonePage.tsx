import { useEffect } from 'react'
import type { Room } from '../data/rooms.ts'
import type { PreorderReceipt } from '../data/preorder.ts'
import { INSTAGRAM_URL } from '../data/social.ts'
import FunnelHeader from '../components/FunnelHeader.tsx'
import ReservationTicket from '../components/ReservationTicket.tsx'

type Props = {
  receipt: PreorderReceipt | null
  votedRoom: Room | null
  onEdit: () => void
  onOpenPreorder: () => void
  onRestart: () => void
  onOpenSurvey: () => void
  surveySent: boolean
}

export default function DonePage({ receipt, votedRoom, onEdit, onOpenPreorder, onRestart, onOpenSurvey, surveySent }: Props) {
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
        <FunnelHeader current={2} onBack={onOpenPreorder} backLabel="사전예약 입력으로 돌아가기" />
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
      <FunnelHeader current={2} complete onBack={onEdit} backLabel="사전예약 화면으로 돌아가기" />
      <header className="done__header">
        <h1 className="done__title">
          {duplicate ? <><span>이미 사전예약한</span><span>이메일이에요</span></> : <span>사전예약이 완료됐어요!</span>}
        </h1>
        <p className="done__lead">출시되면 이메일로 가장 먼저 알려드릴게요.</p>
      </header>

      <ReservationTicket key={receipt.email + ':' + receipt.roomId} receipt={receipt} room={votedRoom} />

      <div className="done__actions">
        {surveySent && <p className="done__survey-thanks" role="status">의견을 보내주셔서 고마워요!<br />다음 스터디룸 기획에 반영할게요.</p>}
        <p className="done__actions-lead">기다리는 동안, 캡슐을 더 만나보세요.</p>
        <a className="done__button done__button--primary" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          인스타그램 구경하기
        </a>
        <button
          type="button"
          className="done__button done__button--outline"
          id="done-open-survey"
          onClick={(event) => {
            // Safari touch activation does not focus buttons. Remember this
            // entry point so returning from the survey restores it as well.
            event.currentTarget.focus({ preventScroll: true })
            onOpenSurvey()
          }}
        >
          나만의 세계 만들어보기
        </button>
        <button type="button" className="done__button done__button--quiet" onClick={onRestart}>
          처음으로 돌아가기
        </button>
      </div>
    </main>
  )
}
