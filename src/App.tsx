import { useState, type SetStateAction } from 'react'
import LandingPage from './pages/LandingPage.tsx'
import RoomsPage from './pages/RoomsPage.tsx'
import SurveyPage from './pages/SurveyPage.tsx'
import PreorderPage from './pages/PreorderPage.tsx'
import DonePage from './pages/DonePage.tsx'
import { ROOMS } from './data/rooms.ts'
import { EMPTY_SURVEY, type SurveyAnswers, type SurveyStatus } from './data/survey.ts'
import { createPreorderDraft, type PreorderDraft, type PreorderReview } from './data/preorder.ts'
import { ROUTES, useRoute } from './hooks/useRoute.ts'

type SurveyDraft = { answers: SurveyAnswers; status: SurveyStatus }

export default function App() {
  const { path, navigate, goBack, restart, returnTo } = useRoute()
  const [votedRoomId, setVotedRoomId] = useState<string | null>(null)
  const [surveyDraft, setSurveyDraft] = useState<SurveyDraft>({ answers: EMPTY_SURVEY, status: 'unanswered' })
  const [preorderDraft, setPreorderDraft] = useState(createPreorderDraft)
  const [preorderReview, setPreorderReview] = useState<PreorderReview | null>(null)
  const editingRoom = path === ROUTES.rooms && returnTo === ROUTES.preorder

  const handleVote = (roomId: string) => {
    setVotedRoomId(roomId)
    setPreorderReview(null)
    if (editingRoom) {
      goBack(ROUTES.preorder)
    } else {
      navigate(ROUTES.survey)
    }
  }

  const updateSurvey = (update: SetStateAction<SurveyAnswers>) => {
    setSurveyDraft((current) => ({ ...current, answers: typeof update === 'function' ? update(current.answers) : update }))
    setPreorderReview(null)
  }

  const updatePreorder = (update: SetStateAction<PreorderDraft>) => {
    setPreorderDraft(update)
    setPreorderReview(null)
  }

  // No transport is configured yet. This only reviews the local draft;
  // a future backend response must separately confirm the reservation.
  const reviewPreorder = async (draft: PreorderDraft) => {
    if (!votedRoomId) throw new Error('A room must be selected before reviewing the draft.')
    setPreorderDraft(draft)
    setPreorderReview({ email: draft.email.trim(), roomId: votedRoomId })
    navigate(ROUTES.done)
  }

  const votedRoom = ROOMS.find((room) => room.id === votedRoomId) ?? null

  if (path === ROUTES.done) {
    const reviewedRoom = ROOMS.find((room) => room.id === preorderReview?.roomId) ?? null
    return <DonePage review={preorderReview} votedRoom={reviewedRoom} onEdit={() => goBack(ROUTES.preorder)} onOpenPreorder={() => navigate(ROUTES.preorder)} onRestart={restart} />
  }
  if (path === ROUTES.preorder) {
    return (
      <PreorderPage
        votedRoom={votedRoom}
        draft={preorderDraft}
        onDraftChange={updatePreorder}
        onReview={reviewPreorder}
        onChangeRoom={() => navigate(ROUTES.rooms, { returnTo: ROUTES.preorder })}
        onBack={() => goBack(ROUTES.survey)}
      />
    )
  }
  if (path === ROUTES.survey) {
    return (
      <SurveyPage
        answers={surveyDraft.answers}
        onAnswersChange={updateSurvey}
        onNext={(status) => { setSurveyDraft((current) => ({ ...current, status })); setPreorderReview(null); navigate(ROUTES.preorder) }}
        onBack={() => goBack(ROUTES.rooms)}
      />
    )
  }
  if (path === ROUTES.rooms) {
    return <RoomsPage votedRoomId={votedRoomId} isEditing={editingRoom} onVote={handleVote} onBack={() => goBack(editingRoom ? ROUTES.preorder : ROUTES.home)} />
  }
  return <LandingPage onOpenRooms={() => navigate(ROUTES.rooms)} />
}
