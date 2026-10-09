import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import RoomSheet from '../components/RoomSheet.tsx'
import { ROOMS } from '../data/rooms.ts'
import backArrow from '../assets/story/cta-arrow.svg'

// Slots for rooms that aren't revealed yet.
const PLACEHOLDER_COUNT = 2

// The grid poster and the sheet's art share this name, so the view
// transition morphs one into the other. Same 116:152 aspect, no distortion.
const ART_NAME = 'room-art'

function morph(card: HTMLElement | undefined, opening: boolean, update: () => void) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!card || !document.startViewTransition || reduceMotion) {
    update()
    return
  }

  const root = document.documentElement
  root.dataset.morph = ''
  if (opening) card.style.viewTransitionName = ART_NAME

  document.startViewTransition(() => {
    card.style.viewTransitionName = opening ? '' : ART_NAME
    update()
  }).finished.finally(() => {
    card.style.viewTransitionName = ''
    delete root.dataset.morph
  })
}

type Props = {
  // One vote per person; held by App so it survives leaving the page.
  votedRoomId: string | null
  onVote: (roomId: string) => void
  onBack: () => void
}

export default function RoomsPage({ votedRoomId, onVote, onBack }: Props) {
  // Last opened room; kept after closing so the sheet can morph back.
  const [activeId, setActiveId] = useState<string | null>(null)
  const sheetRef = useRef<HTMLDialogElement>(null)
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())

  const activeRoom = ROOMS.find((room) => room.id === activeId) ?? null

  useEffect(() => {
    const previous = document.title
    document.title = '스터디룸 투표 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

  const openRoom = (id: string) => {
    morph(cardRefs.current.get(id), true, () => {
      flushSync(() => setActiveId(id))
      sheetRef.current?.showModal()
    })
  }

  const closeRoom = () => {
    const sheet = sheetRef.current
    if (!sheet?.open) return
    morph(activeId ? cardRefs.current.get(activeId) : undefined, false, () => sheet.close())
  }

  // Voting moves on to the survey; the page push carries the open sheet away.
  const voteForActive = () => {
    if (activeId) onVote(activeId)
  }

  return (
    <main className="vote">
      {/* 3. Room vote (Figma 273:356) */}
      <button type="button" className="page-back" aria-label="뒤로 가기" onClick={onBack}>
        <img src={backArrow} alt="" width={24} height={24} />
      </button>

      <header className="vote__header">
        <div className="vote__intro">
          <h1 className="vote__title">
            <span>같이 공부하고 싶은</span>
            <span className="accent">룸을 골라주세요</span>
          </h1>
          <p className="vote__lead">투표한 룸은 사전예약하면 무료로 열어드려요!</p>
        </div>
        <p className="vote__count">현재까지 N명이 투표했어요</p>
      </header>

      <ul className="vote__grid" aria-label="스터디룸">
        {ROOMS.map((room) => (
          <li className="vote__item" key={room.id}>
            <button
              type="button"
              className={`poster vote__card ${room.variant}`}
              aria-haspopup="dialog"
              data-voted={votedRoomId === room.id || undefined}
              ref={(el) => {
                if (el) cardRefs.current.set(room.id, el)
                else cardRefs.current.delete(room.id)
              }}
              onClick={() => openRoom(room.id)}
            >
              <img src={room.image} alt={room.name} />
              {votedRoomId === room.id && <span className="sr-only">(투표함)</span>}
            </button>
            {room.tags && <p className="vote__tags">{room.tags}</p>}
          </li>
        ))}
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
          <li className="vote__item" key={`placeholder-${i}`} aria-hidden="true">
            <div className="poster poster--r5 poster--fill"></div>
          </li>
        ))}
      </ul>

      <p className="vote__hint">스터디룸을 선택해서 <span className="accent">당신의 취향</span>을 확인하세요</p>

      {/* 4. Room detail (Figma 161:756) */}
      <RoomSheet ref={sheetRef} room={activeRoom} onClose={() => closeRoom()} onVote={voteForActive} />
    </main>
  )
}
