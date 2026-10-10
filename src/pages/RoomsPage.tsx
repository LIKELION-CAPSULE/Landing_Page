import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import RoomSheet from '../components/RoomSheet.tsx'
import CheckIcon from '../components/CheckIcon.tsx'
import FunnelHeader from '../components/FunnelHeader.tsx'
import { ROOMS } from '../data/rooms.ts'
import { useRoomPosterTransition } from '../hooks/useRoomPosterTransition.ts'
import { fetchVoteTotal, lastKnownVoteTotal } from '../lib/api.ts'

type Props = {
  // Local selection is held by App; vote persistence belongs to the backend.
  votedRoomId: string | null
  isEditing: boolean
  onVote: (roomId: string) => void
  onBack: () => void
}

export default function RoomsPage({ votedRoomId, isEditing, onVote, onBack }: Props) {
  // Keep the selected content in place while the sheet fades out.
  const [activeId, setActiveId] = useState<string | null>(null)
  const { ref: sheetRef, open: showRoom, close: closeRoom } = useRoomPosterTransition()

  // Retain the verified previous count while the next request is loading.
  const [voteTotal, setVoteTotal] = useState<number | null>(lastKnownVoteTotal)
  const [loadingVoteTotal, setLoadingVoteTotal] = useState(true)
  useEffect(() => {
    let cancelled = false
    fetchVoteTotal().then((total) => {
      if (cancelled) return
      if (total !== null) setVoteTotal(total)
      setLoadingVoteTotal(false)
    })
    return () => { cancelled = true }
  }, [])

  const activeRoom = ROOMS.find((room) => room.id === activeId) ?? null
  const selectedRoom = ROOMS.find((room) => room.id === votedRoomId) ?? null

  useEffect(() => {
    const previous = document.title
    document.title = '스터디룸 투표 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

  const openRoom = (id: string, source: HTMLButtonElement) => {
    if (!sheetRef.current || sheetRef.current.open) return
    flushSync(() => setActiveId(id))
    showRoom(source)
  }

  // Voting moves on to the survey; the page push carries the open sheet away.
  const voteForActive = () => {
    if (activeId) onVote(activeId)
  }

  return (
    <main className="vote">
      {/* 3. Room vote (Figma 273:356) */}
      <FunnelHeader current={1} onBack={onBack} />

      <header className="vote__header">
        <div className="vote__intro">
          <h1 className="vote__title">
            <span>같이 공부하고 싶은</span>
            <span className="accent">룸을 골라주세요</span>
          </h1>
          <p className="vote__lead">사전예약을 하면 투표한 룸을 무료로 제공해드려요!</p>
          <p className="vote__condition">해당 룸이 출시되는 경우 제공돼요.</p>
        </div>
        <p className="vote__instructions">포스터를 눌러 자세히 보고, 룸 1개를 선택해주세요.</p>
        <p className="vote__count" role="status">
          {voteTotal !== null ? `현재까지 ${voteTotal.toLocaleString('ko-KR')}명이 투표했어요` : loadingVoteTotal ? '투표 수를 불러오는 중…' : '투표 수를 불러오지 못했어요.'}
        </p>
      </header>

      <ul className="vote__grid" aria-label="스터디룸">
        {ROOMS.map((room) => (
          <li className="vote__item" key={room.id}>
            <button
              type="button"
              className={`poster vote__card ${room.variant}`}
              id={`room-${room.id}`}
              aria-haspopup="dialog"
              data-voted={votedRoomId === room.id || undefined}
              onClick={(event) => openRoom(room.id, event.currentTarget)}
            >
              <img src={room.image} alt={room.name} loading="lazy" decoding="async" width={1096} height={1440} />
              {votedRoomId === room.id && <span className="vote__badge"><CheckIcon />선택<span className="sr-only">한 룸</span></span>}
            </button>
          </li>
        ))}
      </ul>

      <p className="vote__hint">마음에 드는 룸을 고르면 다음 단계로 넘어가요.</p>
      {selectedRoom && (
        <button type="button" className="cta form-submit vote__continue" id="rooms-continue" onClick={() => onVote(selectedRoom.id)}>
          {isEditing ? '선택 유지하고 돌아가기' : '선택한 룸으로 계속하기'}
        </button>
      )}

      {/* 4. Room detail (Figma 161:756) */}
      <RoomSheet ref={sheetRef} room={activeRoom} voteLabel={isEditing ? '이 룸으로 변경하기' : '이 스터디룸 투표하기'} onClose={closeRoom} onVote={voteForActive} />
    </main>
  )
}
