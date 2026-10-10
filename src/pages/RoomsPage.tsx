import { useEffect, useState } from 'react'
import CheckIcon from '../components/CheckIcon.tsx'
import FunnelHeader from '../components/FunnelHeader.tsx'
import { ROOMS } from '../data/rooms.ts'
import { fetchVoteTotal, lastKnownVoteTotal } from '../lib/api.ts'

type Props = {
  // The reservation room can change independently of the saved vote.
  selectedRoomId: string | null
  onOpenRoom: (roomId: string, source: HTMLButtonElement) => void
  onBack: () => void
}

export default function RoomsPage({ selectedRoomId, onOpenRoom, onBack }: Props) {
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

  useEffect(() => {
    const previous = document.title
    document.title = '스터디룸 투표 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

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
        </div>
        <p className="vote__count" role="status">
          {voteTotal !== null ? <>현재까지 <strong>{voteTotal.toLocaleString('ko-KR')}명</strong>이 투표했어요</> : loadingVoteTotal ? '투표 수를 불러오는 중…' : '투표 수를 불러오지 못했어요.'}
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
              data-selected={selectedRoomId === room.id || undefined}
              onClick={(event) => onOpenRoom(room.id, event.currentTarget)}
            >
              <img src={room.image} alt={room.name} loading="lazy" decoding="async" width={1096} height={1440} />
              {selectedRoomId === room.id && <span className="vote__badge"><CheckIcon />선택<span className="sr-only">한 룸</span></span>}
            </button>
          </li>
        ))}
      </ul>

      <p className="vote__condition">해당 룸이 출시되는 경우 제공돼요.</p>
    </main>
  )
}
