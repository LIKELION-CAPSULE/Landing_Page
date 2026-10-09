import { useState } from 'react'
import LandingPage from './pages/LandingPage.tsx'
import RoomsPage from './pages/RoomsPage.tsx'
import SurveyPage from './pages/SurveyPage.tsx'
import PreorderPage from './pages/PreorderPage.tsx'
import DonePage from './pages/DonePage.tsx'
import { ROOMS } from './data/rooms.ts'
import { EMPTY_SURVEY, type SurveyAnswers } from './data/survey.ts'
import { ROUTES, useRoute } from './hooks/useRoute.ts'

export default function App() {
  const { path, navigate, goBack, restart } = useRoute()
  const [votedRoomId, setVotedRoomId] = useState<string | null>(null)
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>(EMPTY_SURVEY)

  const handleVote = (roomId: string) => {
    setVotedRoomId(roomId)
    navigate(ROUTES.survey)
  }

  const votedRoom = ROOMS.find((room) => room.id === votedRoomId) ?? null

  if (path === ROUTES.done) {
    return <DonePage votedRoom={votedRoom} onRestart={restart} />
  }
  if (path === ROUTES.preorder) {
    return (
      <PreorderPage
        votedRoom={votedRoom}
        onComplete={() => navigate(ROUTES.done)}
        onBack={() => goBack(ROUTES.survey)}
      />
    )
  }
  if (path === ROUTES.survey) {
    return (
      <SurveyPage
        answers={surveyAnswers}
        onAnswersChange={setSurveyAnswers}
        onNext={() => navigate(ROUTES.preorder)}
        onBack={() => goBack(ROUTES.rooms)}
      />
    )
  }
  if (path === ROUTES.rooms) {
    return <RoomsPage votedRoomId={votedRoomId} onVote={handleVote} onBack={() => goBack()} />
  }
  return <LandingPage onOpenRooms={() => navigate(ROUTES.rooms)} />
}
