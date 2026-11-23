import type { ReactNode } from 'react'
type Name = 'mic' | 'camera' | 'chat' | 'pip' | 'hangup' | 'person' | 'pause' | 'play' | 'down'

const paths: Record<Name, ReactNode> = {
  mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
  camera: <><rect x="3" y="6" width="12" height="12" rx="3" /><path d="m15 10 6-3v10l-6-3M3 3l18 18" /></>,
  chat: <path d="M20 12a8 8 0 0 1-8 8H4l1.6-4A8 8 0 1 1 20 12Z" />,
  pip: <><rect x="2.5" y="4" width="19" height="16" rx="3" /><rect x="12" y="11" width="7" height="6" rx="1" /></>,
  hangup: <path d="M3 15c-1-1 1-5 9-5s10 4 9 5l-3 2-3-2v-2a13 13 0 0 0-6 0v2l-3 2-3-2Z" />,
  person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
  pause: <path d="M9 5v14M15 5v14" />,
  play: <path d="m8 4 12 8-12 8V4Z" />,
  down: <path d="m6 9 6 6 6-6" />,
}

export default function CallIcon({ name }: { name: Name }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
