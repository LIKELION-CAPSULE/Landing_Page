import { useState } from 'react'
import LandingPage from './pages/LandingPage.tsx'
import RoomsPage from './pages/RoomsPage.tsx'
import SurveyPage from './pages/SurveyPage.tsx'
import PreorderPage from './pages/PreorderPage.tsx'
import DonePage from './pages/DonePage.tsx'
import { ROOMS } from './data/rooms.ts'
import { EMPTY_SURVEY, type SurveyAnswers } from './data/survey.ts'
import { ROUTES, useRoute } from './hooks/useRoute.ts'
import { track } from './lib/analytics.ts'
import { saveVote } from './lib/api.ts'

export default function App() {
  const { path, navigate, goBack, restart } = useRoute()
  const [votedRoomId, setVotedRoomId] = useState<string | null>(null)
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>(EMPTY_SURVEY)

  // 저장 결과와 무관하게 다음 화면으로 간다 — 실패 안내 UI 가 아직 없다 (docs/data-collection.md).
  // 투표 완료 이벤트는 DB 저장이 성공했을 때만 보낸다.
  const handleVote = async (roomId: string) => {
    setVotedRoomId(roomId)
    const result = await saveVote(roomId)
    if (result === 'saved') track('artwork_vote_submitted', { room_id: roomId })
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
        surveyAnswers={surveyAnswers}
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
