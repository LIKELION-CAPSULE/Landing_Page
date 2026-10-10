import { useState, type SetStateAction } from 'react'
import LandingPage from './pages/LandingPage.tsx'
import RoomsPage from './pages/RoomsPage.tsx'
import SurveyPage from './pages/SurveyPage.tsx'
import PreorderPage from './pages/PreorderPage.tsx'
import DonePage from './pages/DonePage.tsx'
import { ROOMS } from './data/rooms.ts'
import { EMPTY_SURVEY, type SurveyAnswers, type SurveyStatus } from './data/survey.ts'
import { createPreorderDraft, type PreorderDraft, type PreorderReceipt } from './data/preorder.ts'
import { ROUTES, useRoute } from './hooks/useRoute.ts'
import { track } from './lib/analytics.ts'
import { savePreorder, saveVote } from './lib/api.ts'

type SurveyDraft = { answers: SurveyAnswers; status: SurveyStatus }

export default function App() {
  const { path, navigate, goBack, restart, returnTo } = useRoute()
  const [votedRoomId, setVotedRoomId] = useState<string | null>(null)
  const [surveyDraft, setSurveyDraft] = useState<SurveyDraft>({ answers: EMPTY_SURVEY, status: 'unanswered' })
  const [preorderDraft, setPreorderDraft] = useState(createPreorderDraft)
  const [preorderReceipt, setPreorderReceipt] = useState<PreorderReceipt | null>(null)
  const editingRoom = path === ROUTES.rooms && returnTo === ROUTES.preorder

  // 저장을 기다리지 않고 바로 다음 화면으로 간다 (탭 반응이 느려지지 않게).
  // 투표 완료 이벤트는 DB 저장이 성공했을 때만, 저장이 끝난 뒤 보낸다.
  const handleVote = (roomId: string) => {
    setVotedRoomId(roomId)
    setPreorderReceipt(null)
    void saveVote(roomId).then((result) => {
      if (result === 'saved') track('artwork_vote_submitted', { room_id: roomId })
    })
    if (editingRoom) {
      goBack(ROUTES.preorder)
    } else {
      navigate(ROUTES.survey)
    }
  }

  const updateSurvey = (update: SetStateAction<SurveyAnswers>) => {
    setSurveyDraft((current) => ({ ...current, answers: typeof update === 'function' ? update(current.answers) : update }))
    setPreorderReceipt(null)
  }

  const updatePreorder = (update: SetStateAction<PreorderDraft>) => {
    setPreorderDraft(update)
    setPreorderReceipt(null)
  }

  // A disabled connection must never be mistaken for a successful reservation.
  const submitPreorder = async (draft: PreorderDraft) => {
    if (!votedRoomId) throw new Error('A room must be selected before submitting the reservation.')
    setPreorderDraft(draft)
    const result = await savePreorder({
      email: draft.email,
      surveyPicks: surveyDraft.status === 'answered' ? surveyDraft.answers.picks : {},
      surveyWish: surveyDraft.status === 'answered' ? surveyDraft.answers.wish : '',
      marketingConsent: draft.consents.marketing,
      votedRoomId,
    })
    if (result === 'failed' || result === 'disabled') throw new Error('Pre-registration could not be saved.')
    if (result === 'saved') track('presign_completed', { voted_room_id: votedRoomId, marketing_consent: draft.consents.marketing })
    if (result === 'duplicate') track('presign_duplicate', { voted_room_id: votedRoomId })
    setPreorderReceipt({ email: draft.email.trim().toLowerCase(), roomId: votedRoomId, status: result })
    navigate(ROUTES.done)
  }

  const votedRoom = ROOMS.find((room) => room.id === votedRoomId) ?? null

  if (path === ROUTES.done) {
    const reservedRoom = ROOMS.find((room) => room.id === preorderReceipt?.roomId) ?? null
    return <DonePage receipt={preorderReceipt} votedRoom={reservedRoom} onEdit={() => goBack(ROUTES.preorder)} onOpenPreorder={() => navigate(ROUTES.preorder)} onRestart={restart} />
  }
  if (path === ROUTES.preorder) {
    return (
      <PreorderPage
        votedRoom={votedRoom}
        draft={preorderDraft}
        onDraftChange={updatePreorder}
        onSubmitDraft={submitPreorder}
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
        onNext={(status) => { track('presign_cta_clicked', { source: status }); setSurveyDraft((current) => ({ ...current, status })); setPreorderReceipt(null); navigate(ROUTES.preorder) }}
        onBack={() => goBack(ROUTES.rooms)}
      />
    )
  }
  if (path === ROUTES.rooms) {
    return <RoomsPage votedRoomId={votedRoomId} isEditing={editingRoom} onVote={handleVote} onBack={() => goBack(editingRoom ? ROUTES.preorder : ROUTES.home)} />
  }
  return <LandingPage onOpenRooms={() => navigate(ROUTES.rooms)} />
}
