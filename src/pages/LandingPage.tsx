import { lazy, Suspense } from 'react'

const MacbookLandingPage = lazy(() => import('./MacbookLandingPage.tsx'))

type Props = {
  onOpenRooms: () => void
}

export default function LandingPage({ onOpenRooms }: Props) {
  return (
    <Suspense fallback={<main role="status" style={{ padding: 32 }}>캡슐을 불러오는 중…</main>}>
      <MacbookLandingPage onOpenRooms={onOpenRooms} />
    </Suspense>
  )
}
