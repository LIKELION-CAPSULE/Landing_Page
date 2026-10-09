import { useState } from 'react'
import LandingPage from './pages/LandingPage.tsx'
import RoomsPage from './pages/RoomsPage.tsx'
import SurveyPage from './pages/SurveyPage.tsx'
import { ROUTES, useRoute } from './hooks/useRoute.ts'

export default function App() {
  const { path, navigate, goBack } = useRoute()
  const [votedRoomId, setVotedRoomId] = useState<string | null>(null)

  const handleVote = (roomId: string) => {
    setVotedRoomId(roomId)
    navigate(ROUTES.survey)
  }

  if (path === ROUTES.survey) return <SurveyPage onBack={() => goBack(ROUTES.rooms)} />
  if (path === ROUTES.rooms) return <RoomsPage votedRoomId={votedRoomId} onVote={handleVote} onBack={() => goBack()} />
  return <LandingPage onOpenRooms={() => navigate(ROUTES.rooms)} />
}
