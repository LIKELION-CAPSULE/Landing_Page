import type { ReactNode } from 'react'
// Lucide outlines (the app's icon set: Front_Web shared/ui/Icon → AnimateIcons Lucide catalog).
type Name = 'mic' | 'camera' | 'chat' | 'pip' | 'hangup' | 'person' | 'pause' | 'play' | 'down' | 'headphones' | 'videoOff' | 'phoneOff' | 'cameraSmall'

const paths: Record<Name, ReactNode> = {
  mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></>,
  camera: <><rect x="3" y="6" width="12" height="12" rx="3" /><path d="m15 10 6-3v10l-6-3M3 3l18 18" /></>,
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  pip: <><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4" /><rect width="10" height="7" x="12" y="13" rx="2" /></>,
  hangup: <path d="M3 15c-1-1 1-5 9-5s10 4 9 5l-3 2-3-2v-2a13 13 0 0 0-6 0v2l-3 2-3-2Z" />,
  person: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  pause: <path d="M9 5v14M15 5v14" />,
  play: <path d="m8 4 12 8-12 8V4Z" />,
  down: <path d="m6 9 6 6 6-6" />,
  headphones: <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />,
  videoOff: <><path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.25-3.06a.5.5 0 0 1 .75.43v8.2" /><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2M2 2l20 20" /></>,
  phoneOff: <><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" /><path d="M22 2 2 22" /></>,
  cameraSmall: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>,
}

export default function CallIcon({ name, size = 24 }: { name: Name; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
