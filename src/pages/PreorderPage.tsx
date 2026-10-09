import { useEffect, useState, type FormEvent } from 'react'
import Checkbox from '../components/Checkbox.tsx'
import TermsSheet from '../components/TermsSheet.tsx'
import { useAnimatedDialog } from '../hooks/useAnimatedDialog.ts'
import { AGE_OPTIONS, CONSENTS, STUDY_HABITS, type Consent } from '../data/preorder.ts'
import type { Room } from '../data/rooms.ts'
import type { SurveyAnswers } from '../data/survey.ts'
import { track } from '../lib/analytics.ts'
import { savePreorder } from '../lib/api.ts'
import arrow from '../assets/story/cta-arrow.svg'
import gift from '../assets/preorder/gift.svg'
import selectArrow from '../assets/preorder/select-arrow.svg'
import divider from '../assets/preorder/divider.svg'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Props = {
  votedRoom: Room | null
  // 약관의 수집 항목(선택)에 포함돼 사전예약 행에 같이 저장한다.
  surveyAnswers: SurveyAnswers
  onComplete: () => void
  onBack: () => void
}

export default function PreorderPage({ votedRoom, surveyAnswers, onComplete, onBack }: Props) {
  const [email, setEmail] = useState('')
  const [age, setAge] = useState('')
  const [habits, setHabits] = useState<ReadonlySet<string>>(() => new Set())
  const [consents, setConsents] = useState<Record<Consent['id'], boolean>>({ privacy: false, marketing: false })
  // 저장 요청이 나가 있는 동안 버튼을 잠근다 — 더블탭으로 같은 이메일이 두 번 들어가지 않게.
  const [submitting, setSubmitting] = useState(false)

  // Last consent opened from "보기"; kept while the sheet animates out.
  const [termsId, setTermsId] = useState<Consent['id'] | null>(null)
  // Snapshot at open so the button label doesn't flip while closing.
  const [termsAgreed, setTermsAgreed] = useState(false)
  const { ref: termsRef, open: showTerms, close: closeTerms } = useAnimatedDialog()
  const termsConsent = CONSENTS.find((consent) => consent.id === termsId) ?? null

  const canSubmit =
    !submitting && EMAIL_PATTERN.test(email.trim()) && CONSENTS.every((c) => !c.required || consents[c.id])

  useEffect(() => {
    const previous = document.title
    document.title = '사전예약 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

  const toggleHabit = (habit: string, checked: boolean) => {
    setHabits((current) => {
      const next = new Set(current)
      if (checked) next.add(habit)
      else next.delete(habit)
      return next
    })
  }

  const setConsent = (id: Consent['id'], checked: boolean) => {
    setConsents((current) => ({ ...current, [id]: checked }))
  }

  const openTerms = (id: Consent['id']) => {
    setTermsId(id)
    setTermsAgreed(consents[id])
    showTerms()
  }

  const agreeToTerms = () => {
    if (termsId) setConsent(termsId, true)
    closeTerms()
  }

  // 저장 결과와 무관하게 완료 화면으로 간다 — 실패 안내 UI 가 아직 없다 (docs/data-collection.md).
  // 완료 이벤트는 DB 저장이 성공했을 때만, 중복 이메일은 별도 이벤트로 센다.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    const result = await savePreorder({
      email,
      age,
      habits: [...habits],
      surveyPicks: surveyAnswers.picks,
      surveyWish: surveyAnswers.wish,
      marketingConsent: consents.marketing,
      votedRoomId: votedRoom?.id ?? null,
    })
    if (result === 'saved') {
      track('presign_completed', { voted_room_id: votedRoom?.id ?? null, marketing_consent: consents.marketing })
    } else if (result === 'duplicate') {
      track('presign_duplicate', { voted_room_id: votedRoom?.id ?? null })
    }
    setSubmitting(false)
    onComplete()
  }

  return (
    <main className="preorder">
      {/* 6. Pre-registration (Figma 161:514) */}
      <button type="button" className="page-back" aria-label="뒤로 가기" onClick={onBack}>
        <img src={arrow} alt="" width={24} height={24} />
      </button>

      <header className="preorder__header">
        <div className="preorder__intro">
          <h1 className="preorder__title">
            <span>사전예약하고</span>
            <span className="accent">룸을 골라주세요</span>
          </h1>
          <p className="preorder__lead">출시되면 이메일로 가장 먼저 알려드릴게요.</p>
        </div>

        <div className="perk">
          <img className="perk__icon" src={gift} alt="" width={64} height={64} />
          <p className="perk__title">투표한 룸 전체 무료 해금</p>
          {votedRoom && <p className="perk__room">선택한 룸: {votedRoom.name}</p>}
          <p className="perk__note">해당 룸이 출시될 경우 제공돼요.</p>
        </div>
      </header>

      <form className="preorder__form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">이메일</span>
          <input
            className="field__control"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">나이</span>
          <span className="field__select">
            <select
              className="field__control"
              value={age}
              data-empty={age === '' || undefined}
              onChange={(event) => setAge(event.target.value)}
            >
              <option value="" disabled>선택해주세요</option>
              {AGE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <img className="field__select-arrow" src={selectArrow} alt="" width={21} height={21} />
          </span>
        </label>

        <div className="habits" role="group" aria-labelledby="habits-title">
          <p className="habits__head">
            <span className="field__label" id="habits-title">지금 어떻게 공부하세요?</span>
            <span className="habits__note">*복수 선택 가능</span>
          </p>
          <div className="habits__list">
            {STUDY_HABITS.map((habit) => (
              <Checkbox key={habit} checked={habits.has(habit)} onChange={(checked) => toggleHabit(habit, checked)}>
                {habit}
              </Checkbox>
            ))}
          </div>
        </div>

        <img className="preorder__divider" src={divider} alt="" width={359} height={0.5} />

        <div className="consents">
          {CONSENTS.map((consent) => (
            <div className="consents__row" key={consent.id}>
              <Checkbox checked={consents[consent.id]} onChange={(checked) => setConsent(consent.id, checked)}>
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

        <p className="preorder__fine">
          수집한 이메일은 출시 알림과 사전예약 혜택 지급에만 쓰고,<br />
          출시 후 6개월 뒤 파기합니다.
        </p>

        <button type="submit" className="cta form-submit" disabled={!canSubmit}>
          <span>사전예약 완료하기</span>
          <img className="cta__arrow form-submit__arrow" src={arrow} alt="" width={24} height={24} />
        </button>
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
