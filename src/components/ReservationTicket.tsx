import { useId, useState } from 'react'
import type { Room } from '../data/rooms.ts'
import type { PreorderReceipt } from '../data/preorder.ts'

type Props = {
  receipt: PreorderReceipt
  room: Room
}

function maskEmail(email: string) {
  const at = email.lastIndexOf('@')
  return email.slice(0, Math.min(2, Math.max(1, at - 1))) + '***' + email.slice(at)
}

function TicketStub() {
  return (
    <div className="done__ticket-stub" aria-hidden="true">
      <div className="done__ticket-stub-copy">
        <span className="done__ticket-stub-brand">CAPSULE</span>
        <span className="done__ticket-stub-label">사전예약 티켓</span>
      </div>
      <svg className="done__ticket-barcode" viewBox="0 0 90 32" width={90} height={32} fill="currentColor">
        <path d="M0 0h2v32H0zM4 0h1v32H4zM7 0h3v32H7zM12 0h1v32h-1zM16 0h2v32h-2zM20 0h4v32h-4zM26 0h1v32h-1zM30 0h2v32h-2zM34 0h1v32h-1zM37 0h3v32h-3zM43 0h2v32h-2zM47 0h1v32h-1zM51 0h4v32h-4zM57 0h2v32h-2zM62 0h1v32h-1zM65 0h3v32h-3zM70 0h1v32h-1zM74 0h2v32h-2zM78 0h4v32h-4zM85 0h1v32h-1zM88 0h2v32h-2z" />
      </svg>
    </div>
  )
}

function TicketInformation({ receipt, room }: Props) {
  const duplicate = receipt.status === 'duplicate'

  return (
    <div className="done__ticket-information">
      <div className="done__ticket-heading">
        <span className="done__ticket-brand">CAPSULE</span>
        <span className="done__ticket-type">{duplicate ? '사전예약 확인' : '사전예약 티켓'}</span>
      </div>
      <div className="done__ticket-room">
        <p className="done__ticket-eyebrow">{duplicate ? 'RESERVATION CHECK' : '선택한 스터디룸'}</p>
        <h2 className="done__ticket-title">{duplicate ? '기존 사전예약' : room.name}</h2>
      </div>
      <dl className="done__ticket-details">
        <div>
          <dt>예약 상태</dt>
          <dd>{duplicate ? '이미 사전예약한 이메일' : '사전예약 완료'}</dd>
        </div>
        {!duplicate && <div>
          <dt>예약 혜택</dt>
          <dd>
            선택한 룸 무료 해금
            <p className="done__ticket-note">해당 룸이 출시될 경우 제공돼요.</p>
          </dd>
        </div>}
        <div>
          <dt>출시 알림</dt>
          <dd><bdi>{maskEmail(receipt.email)}</bdi></dd>
        </div>
      </dl>
      <p className="done__ticket-footnote">
        {duplicate ? '기존 예약 정보와 혜택은 변경되지 않았어요.' : '출시되면 이 이메일로 가장 먼저 알려드릴게요.'}
      </p>
    </div>
  )
}

function TicketBack(props: Props) {
  return (
    <div className="done__ticket-surface">
      <div className="done__ticket-body">
        <TicketInformation {...props} />
      </div>
      <TicketStub />
    </div>
  )
}

export default function ReservationTicket({ receipt, room }: Props) {
  const [flipped, setFlipped] = useState(false)
  const id = useId()
  const infoId = id + '-information'
  const hintId = id + '-hint'
  const duplicate = receipt.status === 'duplicate'

  return (
    <section className="done__reservation" aria-label="사전예약 티켓">
      {duplicate ? (
        <div className="done__ticket-face done__ticket-face--back done__ticket-face--static">
          <TicketBack receipt={receipt} room={room} />
        </div>
      ) : (
        <>
          <div className="done__ticket-scene">
            <div className="done__ticket-inner" data-flipped={flipped}>
              <div className="done__ticket-face done__ticket-face--front" aria-hidden={flipped}>
                <div className="done__ticket-surface">
                  <div className="done__ticket-body">
                    <div className="done__ticket-art">
                      <img src={room.image} alt={room.name} width={268} height={351} draggable={false} />
                    </div>
                  </div>
                  <TicketStub />
                </div>
              </div>
              <div className="done__ticket-face done__ticket-face--back" id={infoId} aria-hidden={!flipped}>
                <TicketBack receipt={receipt} room={room} />
              </div>
            </div>
            <button
              type="button"
              className="done__ticket-flip"
              aria-pressed={flipped}
              aria-controls={infoId}
              aria-describedby={hintId}
              onClick={() => setFlipped(current => !current)}
            >
              <span className="sr-only">티켓 뒤집기</span>
            </button>
          </div>
          <p className="done__ticket-hint" id={hintId} data-flipped={flipped}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" aria-hidden="true">
              <path d="M4 10a8 8 0 0 1 13.5-5.5L20 7M20 7V2m0 5h-5M20 14a8 8 0 0 1-13.5 5.5L4 17M4 17v5m0-5h5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {flipped ? '터치해서 포스터 보기' : '터치해서 예약 정보 보기'}
          </p>
        </>
      )}
    </section>
  )
}
