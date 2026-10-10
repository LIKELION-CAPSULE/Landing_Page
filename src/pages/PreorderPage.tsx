import { useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'
import Checkbox from '../components/Checkbox.tsx'
import TermsSheet from '../components/TermsSheet.tsx'
import FunnelHeader from '../components/FunnelHeader.tsx'
import { useAnimatedDialog } from '../hooks/useAnimatedDialog.ts'
import { AGE_OPTIONS, CONSENTS, HABIT_OTHER_LIMIT, STUDY_HABITS, type Consent, type PreorderDraft } from '../data/preorder.ts'
import type { Room } from '../data/rooms.ts'
import type { SurveyAnswers, SurveyStatus } from '../data/survey.ts'
import arrow from '../assets/story/cta-arrow.svg'
import selectArrow from '../assets/preorder/select-arrow.svg'
import divider from '../assets/preorder/divider.svg'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailError(value: string) {
  if (!value.trim()) return '출시 알림을 받을 이메일을 입력해주세요.'
  if (!EMAIL_PATTERN.test(value.trim())) return '이메일을 you@example.com 형식으로 입력해주세요.'
  return ''
}

type Props = {
  votedRoom: Room | null
  draft: PreorderDraft
  onDraftChange: Dispatch<SetStateAction<PreorderDraft>>
  surveyAnswers: SurveyAnswers
  surveyStatus: SurveyStatus
  onReview: (draft: PreorderDraft) => Promise<void>
  onChangeRoom: () => void
  onEditSurvey: () => void
  onBack: () => void
}

export default function PreorderPage({ votedRoom, draft, onDraftChange, surveyAnswers, surveyStatus, onReview, onChangeRoom, onEditSurvey, onBack }: Props) {
  const [emailTouched, setEmailTouched] = useState(false)
  const [showPrivacyError, setShowPrivacyError] = useState(false)
  const [showRoomError, setShowRoomError] = useState(false)
  const [checking, setChecking] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)
  const privacyRef = useRef<HTMLInputElement>(null)
  const changeRoomRef = useRef<HTMLButtonElement>(null)
  const checkingRef = useRef(false)
  const mountedRef = useRef(true)
  const { email, age, habits, habitOther, consents } = draft

  // Last consent opened from "보기"; kept while the sheet animates out.
  const [termsId, setTermsId] = useState<Consent['id'] | null>(null)
  // Snapshot at open so the button label doesn't flip while closing.
  const [termsAgreed, setTermsAgreed] = useState(false)
  const { ref: termsRef, open: showTerms, close: closeTerms } = useAnimatedDialog()
  const termsConsent = CONSENTS.find((consent) => consent.id === termsId) ?? null

  const emailMessage = emailTouched ? emailError(email) : ''
  const privacyMessage = showPrivacyError && !consents.privacy ? '사전예약하려면 개인정보 수집·이용에 동의해주세요.' : ''
  const roomMessage = showRoomError && !votedRoom ? '함께 공부할 룸을 먼저 선택해주세요.' : ''
  const pickCount = Object.values(surveyAnswers.picks).reduce((count, picks) => count + picks.size, 0)
  const surveySummary = surveyStatus === 'skipped' ? '건너뛰었어요' : surveyStatus === 'answered' ?
    (pickCount ? `${pickCount}개 선택${surveyAnswers.wish.trim() ? ' · 자유 입력 포함' : ''}` : '자유 입력으로 답했어요') : '선택사항이에요'

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const previous = document.title
    document.title = '사전예약 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

  const toggleHabit = (habit: string, checked: boolean) => {
    onDraftChange((current) => {
      const next = new Set(current.habits)
      if (checked) next.add(habit)
      else next.delete(habit)
      return { ...current, habits: next }
    })
  }

  const setConsent = (id: Consent['id'], checked: boolean) => {
    onDraftChange((current) => ({ ...current, consents: { ...current.consents, [id]: checked } }))
  }

  const openTerms = (id: Consent['id']) => {
    flushSync(() => {
      setTermsId(id)
      setTermsAgreed(consents[id])
    })
    showTerms()
  }

  const agreeToTerms = () => {
    if (termsId) setConsent(termsId, true)
    closeTerms()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (checkingRef.current) return
    flushSync(() => {
      setEmailTouched(true)
      setShowPrivacyError(true)
      setShowRoomError(true)
      setReviewError('')
    })

    if (!votedRoom) { changeRoomRef.current?.focus(); return }
    if (emailError(email)) { emailRef.current?.focus(); return }
    if (!consents.privacy) { privacyRef.current?.focus(); return }

    checkingRef.current = true
    setChecking(true)
    try {
      await onReview({ ...draft, email: email.trim() })
    } catch {
      if (mountedRef.current) setReviewError('입력 내용을 확인하지 못했어요. 내용은 유지되니 다시 확인해주세요.')
    } finally {
      checkingRef.current = false
      if (mountedRef.current) setChecking(false)
    }
  }

  return (
    <main className="preorder">
      {/* 6. Pre-registration (Figma 161:514) */}
      <FunnelHeader current={3} onBack={onBack} disabled={checking} />

      <header className="preorder__header">
        <div className="preorder__intro">
          <h1 className="preorder__title">
            <span>사전예약하고</span>
            <span className="accent">출시 알림 받기</span>
          </h1>
          <p className="preorder__lead">출시되면 이메일로 가장 먼저 알려드릴게요.</p>
        </div>

        <div className="preorder__room-card" data-empty={!votedRoom || undefined}>
          <div className="preorder__room-head">
            <p className="preorder__room-label">선택한 룸</p>
            <button type="button" className="text-action preorder__room-change" id="preorder-change-room" ref={changeRoomRef} disabled={checking} aria-describedby={roomMessage ? 'room-error' : undefined} onClick={onChangeRoom}>
              {votedRoom ? '룸 변경' : '룸 선택'}
            </button>
          </div>
          <div className="preorder__room-body">
            {votedRoom && <img className="preorder__room-thumb" src={votedRoom.image} alt="" width={200} height={275} />}
            <div className="preorder__room-info">
              <p className="perk__room">{votedRoom?.name ?? '먼저 룸을 선택해주세요'}</p>
            </div>
          </div>
          <p className="perk__note">사전예약 후, 해당 룸 출시 시 무료 해금</p>
        </div>
        <p className="field__error" id="room-error">{roomMessage}</p>
        <div className="preorder__survey-summary">
          <p>취향 조사 <span>{surveySummary}</span></p>
          <button type="button" className="text-action" id="preorder-edit-survey" disabled={checking} onClick={onEditSurvey}>{surveyStatus === 'unanswered' ? '답변하기' : '수정'}</button>
        </div>
        <p className="preorder__preview-note">지금은 입력 내용만 확인할 수 있어요.<br />예약 정보는 전송되지 않아요.</p>
      </header>

      <form className="preorder__form" onSubmit={handleSubmit} noValidate aria-busy={checking}>
        <fieldset className="preorder__fields" disabled={checking}>
          <label className="field">
            <span className="field__label">이메일 <span className="field__requirement">필수</span></span>
            <input
              className="field__control"
              id="preorder-email"
              name="email"
              ref={emailRef}
              required
              maxLength={254}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => onDraftChange((current) => ({ ...current, email: event.target.value }))}
              aria-invalid={!!emailMessage || undefined}
              aria-describedby={`email-hint${emailMessage ? ' email-error' : ''}`}
            />
            <span className="field__hint" id="email-hint">출시 알림을 받을 주소를 입력해주세요.</span>
            <span className="field__error" id="email-error">{emailMessage}</span>
          </label>

          <label className="field">
            <span className="field__label">나이대 <span className="field__requirement">선택</span></span>
            <span className="field__select">
              <select
                className="field__control"
                name="ageGroup"
                value={age}
                data-empty={age === '' || undefined}
                onChange={(event) => onDraftChange((current) => ({ ...current, age: event.target.value }))}
              >
                <option value="">선택하지 않음</option>
                {AGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <img className="field__select-arrow" src={selectArrow} alt="" width={21} height={21} />
            </span>
          </label>

          <div className="habits" role="group" aria-labelledby="habits-title">
            <p className="habits__head">
              <span className="field__label" id="habits-title">지금 어떻게 공부하세요? <span className="field__requirement">선택</span></span>
              <span className="habits__note">복수 선택 가능</span>
            </p>
            <div className="habits__list">
              {STUDY_HABITS.map((habit, index) => (
                <Checkbox key={habit} id={`habit-${index}`} name="studyHabits" value={habit} checked={habits.has(habit)} onChange={(checked) => toggleHabit(habit, checked)}>
                  {habit}
                </Checkbox>
              ))}
            </div>
            {habits.has('기타') && (
              <label className="field habits__other">
                <span className="field__hint">다른 공부 방식을 알려주세요. <span className="field__requirement">선택</span></span>
                <input className="field__control" name="habitOther" maxLength={HABIT_OTHER_LIMIT} placeholder="예: 집에서 백색소음을 틀고 공부해요" value={habitOther} onChange={(event) => onDraftChange((current) => ({ ...current, habitOther: event.target.value }))} aria-describedby="habit-other-hint" />
                <span className="field__meta"><span id="habit-other-hint">최대 {HABIT_OTHER_LIMIT}자</span><span aria-hidden="true">{habitOther.length}/{HABIT_OTHER_LIMIT}</span></span>
              </label>
            )}
          </div>

          <img className="preorder__divider" src={divider} alt="" width={359} height={0.5} />

          <div className="consents">
            {CONSENTS.map((consent) => (
              <div className="consents__row" key={consent.id}>
                <Checkbox ref={consent.id === 'privacy' ? privacyRef : undefined} id={`consent-${consent.id}`} name={`${consent.id}Consent`} required={consent.required} invalid={consent.id === 'privacy' && !!privacyMessage} describedBy={consent.id === 'privacy' && privacyMessage ? 'privacy-error' : undefined} checked={consents[consent.id]} onChange={(checked) => setConsent(consent.id, checked)}>
                  {consent.label}
                </Checkbox>
                <button
                  type="button"
                  className="consents__view"
                  aria-label={`${consent.label} 보기`}
                  aria-haspopup="dialog"
                  onClick={() => openTerms(consent.id)}
                >
                  보기
                </button>
              </div>
            ))}
          </div>
          <p className="field__error consents__error" id="privacy-error">{privacyMessage}</p>

          <p className="preorder__fine">
            이메일은 출시 알림과 사전예약 혜택 지급에 사용해요.
            이벤트·혜택 정보는 선택 동의한 경우에만 보내요.
            서비스 출시 후 6개월 뒤 파기해요.
          </p>

          <button type="submit" className="cta form-submit" id="preorder-review" disabled={checking}>
            <span>{checking ? '입력 확인 중…' : reviewError ? '다시 확인하기' : '입력 내용 확인하기'}</span>
            <img className="cta__arrow form-submit__arrow" src={arrow} alt="" width={24} height={24} />
          </button>
        </fieldset>
        <p className="form-feedback" role="status">{reviewError}</p>
      </form>

      <TermsSheet
        ref={termsRef}
        consent={termsConsent}
        agreed={termsAgreed}
        onAgree={agreeToTerms}
        onClose={closeTerms}
      />
    </main>
  )
}
