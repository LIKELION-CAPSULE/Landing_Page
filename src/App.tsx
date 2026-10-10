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
import { track } from './lib/analytics.ts'
import { savePreorder, saveVote } from './lib/api.ts'

type SurveyDraft = { answers: SurveyAnswers; status: SurveyStatus }

export default function App() {
  const { path, navigate, goBack, restart, returnTo } = useRoute()
  const [votedRoomId, setVotedRoomId] = useState<string | null>(null)
  const [surveyDraft, setSurveyDraft] = useState<SurveyDraft>({ answers: EMPTY_SURVEY, status: 'unanswered' })
  const [preorderDraft, setPreorderDraft] = useState(createPreorderDraft)
  const [preorderReview, setPreorderReview] = useState<PreorderReview | null>(null)
  const editingRoom = path === ROUTES.rooms && returnTo === ROUTES.preorder

  // 저장 결과와 무관하게 다음 화면으로 간다. 투표 완료 이벤트는 DB 저장이 성공했을 때만.
  const handleVote = async (roomId: string) => {
    setVotedRoomId(roomId)
    setPreorderReview(null)
    const result = await saveVote(roomId)
    if (result === 'saved') track('artwork_vote_submitted', { room_id: roomId })
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

  // Supabase 에 저장한 뒤 완료 화면으로 간다. 저장 실패는 throw 해서 PreorderPage 의
  // 기존 오류 안내(reviewError)가 뜨게 한다. 이미 등록된 이메일은 완료로 취급한다.
  const reviewPreorder = async (draft: PreorderDraft) => {
    if (!votedRoomId) throw new Error('A room must be selected before reviewing the draft.')
    setPreorderDraft(draft)
    const result = await savePreorder({
      email: draft.email,
      surveyPicks: surveyDraft.answers.picks,
      surveyWish: surveyDraft.answers.wish,
      marketingConsent: draft.consents.marketing,
      votedRoomId,
    })
    if (result === 'failed') throw new Error('Pre-registration could not be saved.')
    if (result === 'saved') track('presign_completed', { voted_room_id: votedRoomId, marketing_consent: draft.consents.marketing })
    if (result === 'duplicate') track('presign_duplicate', { voted_room_id: votedRoomId })
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
        onNext={(status) => { track('presign_cta_clicked', { source: status }); setSurveyDraft((current) => ({ ...current, status })); setPreorderReview(null); navigate(ROUTES.preorder) }}
        onBack={() => goBack(ROUTES.rooms)}
      />
    )
  }
  if (path === ROUTES.rooms) {
    return <RoomsPage votedRoomId={votedRoomId} isEditing={editingRoom} onVote={handleVote} onBack={() => goBack(editingRoom ? ROUTES.preorder : ROUTES.home)} />
  }
  return <LandingPage onOpenRooms={() => navigate(ROUTES.rooms)} />
}
