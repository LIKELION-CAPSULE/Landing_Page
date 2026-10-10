import { useLayoutEffect, type MouseEvent, type RefObject, type SyntheticEvent } from 'react'
import type { Room } from '../data/rooms.ts'
import arrow from '../assets/story/cta-arrow.svg'

export type RoomConfirmation = 'vote' | 'change'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  room: Room | null
  voteLabel?: string
  pending?: boolean
  confirmation?: RoomConfirmation | null
  error?: string
  onClose: () => void
  onDismissed: () => void
  onVote: () => void
}

// Room detail card (Figma 161:756). Opened with showModal() so focus is
// trapped and the page behind goes inert.
export default function RoomSheet({ ref, room, voteLabel = '이 스터디룸 투표하기', pending = false, confirmation = null, error = '', onClose, onDismissed, onVote }: Props) {
  const changed = confirmation === 'change'
  const confirmationTitle = changed ? '변경 성공!' : '투표 성공!'
  useLayoutEffect(() => {
    if (confirmation) ref.current?.querySelector<HTMLElement>('.room-sheet__success')?.focus({ preventScroll: true })
  }, [ref, confirmation])

  // Esc: run our animated close instead of the instant native one.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    onClose()
  }

  // The card fills the dialog box, so a click landing on the dialog
  // itself came from the backdrop.
  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={ref}
      className="room-sheet"
      data-success={!!confirmation || undefined}
      aria-label={confirmation ? confirmationTitle : room ? `${room.name} 스터디룸 상세` : '스터디룸 상세'}
      aria-describedby={confirmation ? 'vote-success-message' : room?.description.trim() ? 'room-sheet-description' : undefined}
      onCancel={handleCancel}
      onClick={handleClick}
      onClose={onDismissed}
    >
      {confirmation ? (
        <div className="room-sheet__success" tabIndex={-1}>
          <h2>{confirmationTitle}</h2>
          <p id="vote-success-message">{changed ? '아쉽게도 스터디룸 투표 변경은 불가능해요 :(' : <>사전예약하면 런칭 시<br />무료로 룸을 열어드려요!</>}</p>
          <button type="button" className="room-sheet__vote" id="vote-success-confirm" onClick={onClose}>{changed ? '괜찮아요' : '좋아요'}</button>
        </div>
      ) : room && (
        <div className="room-sheet__card" tabIndex={-1} autoFocus>
          <div className="room-sheet__art">
            <img src={room.image} alt="" />
            <div className="room-sheet__fade" aria-hidden="true"></div>
          </div>

          <button type="button" className="room-sheet__close" aria-label="닫기" onClick={onClose}>
            <img src={arrow} alt="" width={24} height={24} />
          </button>

          <div className="room-sheet__content">
            {room.description.trim() && <p className="room-sheet__desc" id="room-sheet-description">{room.description}</p>}
            {error && <p className="room-sheet__error" role="alert">{error}</p>}
            <button type="button" className="room-sheet__vote" disabled={pending} aria-busy={pending} onClick={onVote}>
              <span>{pending ? '투표하는 중…' : error ? '다시 투표하기' : voteLabel}</span>
              <img className="room-sheet__vote-arrow" src={arrow} alt="" width={24} height={24} />
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
