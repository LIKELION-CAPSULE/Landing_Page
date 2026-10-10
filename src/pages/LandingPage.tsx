import MacbookLandingPage from './MacbookLandingPage.tsx'

type Props = {
  onOpenRooms: () => void
}

export default function LandingPage({ onOpenRooms }: Props) {
  return (
    <MacbookLandingPage onOpenRooms={onOpenRooms} />
  )
}
