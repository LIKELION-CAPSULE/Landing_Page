import { useEffect, useState } from 'react'
import poster1 from '../assets/hero/poster-1.png'
import poster2 from '../assets/hero/poster-2.png'
import poster3 from '../assets/hero/poster-3.png'
import poster4 from '../assets/hero/poster-4.png'
import poster5 from '../assets/hero/poster-5.png'
import poster6 from '../assets/hero/poster-6.png'
import poster7 from '../assets/hero/poster-7.png'
import backArrow from '../assets/story/cta-arrow.svg'

type Room = {
  id: string
  name: string
  image: string
  // Matches the hero poster classes: corner radius and image crop differ per art.
  variant: string
  tags?: string
}

const ROOMS: Room[] = [
  { id: 'smile', name: '쌀쌀맞은 가루짝꿍이 나에게만 친절하다!', image: poster1, variant: 'poster--r5 poster--fill', tags: '#청춘 #연애' },
  { id: 'lantern', name: '김상병의 두근두근 비밀연등', image: poster2, variant: 'poster--r9' },
  { id: 'top', name: '전교 1등을 이겨라', image: poster3, variant: 'poster--r9' },
  { id: 'fenesis', name: '페네시스 마법학교', image: poster4, variant: 'poster--r5 poster--fill poster--crop' },
  { id: 'cat', name: '냥냥이가 날 그렇게 쳐다보면 집중할 수가 없잖아!!', image: poster5, variant: '' },
  { id: 'baekdojun', name: '백도준', image: poster6, variant: 'poster--r5 poster--fill' },
  { id: 'jurassic', name: '쥬라기 독서실', image: poster7, variant: '', tags: '#청춘 #연애' },
]

// Slots for rooms that aren't revealed yet.
const PLACEHOLDER_COUNT = 2

type Props = {
  onBack: () => void
}

export default function RoomsPage({ onBack }: Props) {
  // One vote per person: picking a room replaces the previous pick.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const previous = document.title
    document.title = '스터디룸 투표 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

  const toggle = (id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }

  return (
    <main className="vote">
      {/* 3. Room vote (Figma 273:356) */}
      <button type="button" className="vote__back" aria-label="뒤로 가기" onClick={onBack}>
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
              aria-pressed={selectedId === room.id}
              onClick={() => toggle(room.id)}
            >
              <img src={room.image} alt={room.name} />
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
    </main>
  )
}
