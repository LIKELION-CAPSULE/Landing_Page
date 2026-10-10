import { useEffect, useRef, useState, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'
import LandingPage from './pages/LandingPage.tsx'
import RoomsPage from './pages/RoomsPage.tsx'
import SurveyPage from './pages/SurveyPage.tsx'
import PreorderPage from './pages/PreorderPage.tsx'
import DonePage from './pages/DonePage.tsx'
import RoomSheet, { type RoomConfirmation } from './components/RoomSheet.tsx'
import { ROOMS } from './data/rooms.ts'
import { EMPTY_SURVEY, type SurveyAnswers } from './data/survey.ts'
import { createPreorderDraft, type PreorderDraft, type PreorderReceipt } from './data/preorder.ts'
import { ROUTES, useRoute } from './hooks/useRoute.ts'
import { useRoomPosterTransition } from './hooks/useRoomPosterTransition.ts'
import { track } from './lib/analytics.ts'
import { savePreorder, saveSurvey, saveVote } from './lib/api.ts'

export default function App() {
  const { path, navigate, goBack, restart, returnTo } = useRoute()
  // The original vote stays fixed; only the reservation selection can change.
  const [votedRoomId, setVotedRoomId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>(EMPTY_SURVEY)
  const [surveySent, setSurveySent] = useState(false)
  const [preorderDraft, setPreorderDraft] = useState(createPreorderDraft)
  const [preorderReceipt, setPreorderReceipt] = useState<PreorderReceipt | null>(null)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [votePending, setVotePending] = useState(false)
  const [roomConfirmation, setRoomConfirmation] = useState<RoomConfirmation | null>(null)
  const [voteError, setVoteError] = useState('')
  const votePendingRef = useRef(false)
  const voteGeneration = useRef(0)
  const { ref: sheetRef, open: openSheet, close: closeSheet, settle: settleSheet } = useRoomPosterTransition()
  const editingRoom = path === ROUTES.rooms && returnTo === ROUTES.preorder
  const activeRoom = ROOMS.find(room => room.id === activeRoomId) ?? null
  const selectedRoom = ROOMS.find(room => room.id === selectedRoomId) ?? null

  // Keep the same top-layer dialog while only the background page changes.
  useEffect(() => {
    const allowed = (path === ROUTES.rooms && !roomConfirmation) || (path === ROUTES.preorder && !!roomConfirmation)
    if (!allowed && sheetRef.current?.open) {
      voteGeneration.current += 1
      settleSheet()
      sheetRef.current.close()
    }
  }, [path, roomConfirmation, sheetRef, settleSheet])

  useEffect(() => () => { voteGeneration.current += 1 }, [])

  const openRoom = (roomId: string, source: HTMLButtonElement) => {
    if (!sheetRef.current || sheetRef.current.open) return
    voteGeneration.current += 1
    votePendingRef.current = false
    flushSync(() => {
      setActiveRoomId(roomId)
      setVotePending(false)
      setRoomConfirmation(null)
      setVoteError('')
    })
    openSheet(source)
  }

  const dismissVote = () => {
    voteGeneration.current += 1
    closeSheet()
  }

  const voteDialogClosed = () => {
    votePendingRef.current = false
    setVotePending(false)
    setVoteError('')
    setActiveRoomId(null)
    setRoomConfirmation(null)
    if (roomConfirmation) {
      const heading = document.querySelector<HTMLElement>('.preorder h1')
      if (heading) {
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      }
    }
  }

  const handleVote = async () => {
    if (!activeRoom || votePendingRef.current) return
    const roomId = activeRoom.id
    // A room change edits the reservation draft, preserving the original vote.
    if (votedRoomId) {
      settleSheet()
      setSelectedRoomId(roomId)
      if (roomId !== selectedRoomId) setPreorderReceipt(null)
      setRoomConfirmation('change')
      navigate(ROUTES.preorder, { animate: false })
      return
    }
    const pass = ++voteGeneration.current
    votePendingRef.current = true
    setVotePending(true)
    setVoteError('')
    try {
      const result = await saveVote(roomId)
      if (voteGeneration.current !== pass) return
      if (result !== 'saved') throw new Error('The vote was not saved.')
      track('artwork_vote_submitted', { room_id: roomId })
      track('presign_cta_clicked', { source: 'vote' })
      settleSheet()
      setVotedRoomId(roomId)
      setSelectedRoomId(roomId)
      setPreorderReceipt(null)
      setVotePending(false)
      setRoomConfirmation('vote')
      navigate(ROUTES.preorder, { animate: false })
    } catch {
      if (voteGeneration.current === pass) setVoteError('투표를 저장하지 못했어요. 다시 시도해주세요.')
    } finally {
      if (voteGeneration.current === pass) {
        votePendingRef.current = false
        setVotePending(false)
      }
    }
  }

  const updateSurvey = (update: SetStateAction<SurveyAnswers>) => {
    setSurveyAnswers(current => typeof update === 'function' ? update(current) : update)
    setSurveySent(false)
  }

  const updatePreorder = (update: SetStateAction<PreorderDraft>) => {
    setPreorderDraft(update)
    setPreorderReceipt(null)
  }

  const submitPreorder = async (draft: PreorderDraft) => {
    if (!selectedRoomId) throw new Error('A room must be selected before submitting the reservation.')
    setPreorderDraft(draft)
    const result = await savePreorder({ email: draft.email, marketingConsent: draft.consents.marketing, votedRoomId: selectedRoomId })
    if (result === 'failed' || result === 'disabled') throw new Error('Pre-registration could not be saved.')
    if (result === 'saved') track('presign_completed', { voted_room_id: selectedRoomId, marketing_consent: draft.consents.marketing })
    if (result === 'duplicate') track('presign_duplicate', { voted_room_id: selectedRoomId })
    setPreorderReceipt({ email: draft.email.trim().toLowerCase(), roomId: selectedRoomId, status: result })
    navigate(ROUTES.done)
  }

  const submitSurvey = async (answers: SurveyAnswers) => {
    if (!preorderReceipt) throw new Error('A reservation must be completed first.')
    const result = await saveSurvey({ ...answers, roomId: preorderReceipt.roomId })
    if (result !== 'saved') throw new Error('The survey could not be saved.')
    setSurveySent(true)
    track('survey_completed', { room_id: preorderReceipt.roomId })
    if (window.location.pathname === ROUTES.survey) goBack(ROUTES.done)
  }

  const openSurvey = () => {
    track('survey_cta_clicked', { room_id: preorderReceipt?.roomId ?? null })
    navigate(ROUTES.survey, { returnTo: ROUTES.done })
  }

  let page
  if (path === ROUTES.done) {
    const reservedRoom = ROOMS.find(room => room.id === preorderReceipt?.roomId) ?? null
    page = (
      <DonePage
        receipt={preorderReceipt}
        votedRoom={reservedRoom}
        surveySent={surveySent}
        onEdit={() => goBack(ROUTES.preorder)}
        onOpenPreorder={() => navigate(ROUTES.preorder)}
        onRestart={restart}
        onOpenSurvey={openSurvey}
      />
    )
  } else if (path === ROUTES.preorder) {
    page = (
      <PreorderPage
        votedRoom={selectedRoom}
        draft={preorderDraft}
        onDraftChange={updatePreorder}
        onSubmitDraft={submitPreorder}
        onChangeRoom={() => navigate(ROUTES.rooms, { returnTo: ROUTES.preorder })}
        onBack={() => goBack(ROUTES.rooms)}
      />
    )
  } else if (path === ROUTES.survey) {
    page = (
      <SurveyPage
        answers={surveyAnswers}
        reservationReady={!!preorderReceipt}
        onAnswersChange={updateSurvey}
        onSubmitAnswers={submitSurvey}
        onOpenPreorder={() => navigate(ROUTES.preorder)}
        onBack={() => goBack(ROUTES.done)}
      />
    )
  } else if (path === ROUTES.rooms) {
    page = (
      <RoomsPage
        selectedRoomId={selectedRoomId}
        onOpenRoom={openRoom}
        onBack={() => goBack(editingRoom ? ROUTES.preorder : ROUTES.home)}
      />
    )
  } else {
    page = <LandingPage onOpenRooms={() => navigate(ROUTES.rooms)} />
  }

  return (
    <>
      {page}
      <RoomSheet
        ref={sheetRef}
        room={activeRoom}
        pending={votePending}
        confirmation={roomConfirmation}
        error={voteError}
        voteLabel={votedRoomId ? '이 룸으로 변경하기' : '이 스터디룸 투표하기'}
        onVote={() => { void handleVote() }}
        onClose={dismissVote}
        onDismissed={voteDialogClosed}
      />
    </>
  )
}
