import type { MouseEvent, RefObject, SyntheticEvent } from 'react'
import type { Room } from '../data/rooms.ts'
import arrow from '../assets/story/cta-arrow.svg'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  room: Room | null
  voteLabel?: string
  onClose: () => void
  onVote: () => void
}

// Room detail card (Figma 161:756). Opened with showModal() so focus is
// trapped and the page behind goes inert.
export default function RoomSheet({ ref, room, voteLabel = '이 스터디룸 투표하기', onClose, onVote }: Props) {
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
      aria-label={room ? `${room.name} 스터디룸 상세` : '스터디룸 상세'}
      aria-describedby={room?.description.trim() ? 'room-sheet-description' : undefined}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {room && (
        <div className="room-sheet__card">
          <div className="room-sheet__art">
            <img src={room.image} alt="" />
            <div className="room-sheet__fade" aria-hidden="true"></div>
          </div>

          <button type="button" className="room-sheet__close" aria-label="닫기" onClick={onClose}>
            <img src={arrow} alt="" width={24} height={24} />
          </button>

          <div className="room-sheet__content">
            {room.description.trim() && <p className="room-sheet__desc" id="room-sheet-description">{room.description}</p>}
            <button type="button" className="room-sheet__vote" onClick={onVote}>
              <span>{voteLabel}</span>
              <img className="room-sheet__vote-arrow" src={arrow} alt="" width={24} height={24} />
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
