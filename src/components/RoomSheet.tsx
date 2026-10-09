import type { MouseEvent, RefObject, SyntheticEvent } from 'react'
import type { Room } from '../data/rooms.ts'
import arrow from '../assets/story/cta-arrow.svg'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  room: Room | null
  onClose: () => void
  onVote: () => void
}

// Room detail card (Figma 161:756). Opened with showModal() so focus is
// trapped and the page behind goes inert.
export default function RoomSheet({ ref, room, onClose, onVote }: Props) {
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
      aria-labelledby="room-sheet-title"
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {room && (
        <div className="room-sheet__card">
          <div className="room-sheet__art">
            <img src={room.image} alt="" />
          </div>
          <div className="room-sheet__fade" aria-hidden="true"></div>

          <button type="button" className="room-sheet__close" aria-label="닫기" onClick={onClose}>
            <img src={arrow} alt="" width={24} height={24} />
          </button>

          <h2 className="room-sheet__title" id="room-sheet-title">{room.name}</h2>
          <p className="room-sheet__desc">{room.description}</p>
          <button type="button" className="room-sheet__vote" onClick={onVote}>
            <span>이 스터디룸 투표하기</span>
            <img className="room-sheet__vote-arrow" src={arrow} alt="" width={24} height={24} />
          </button>
        </div>
      )}
    </dialog>
  )
}
