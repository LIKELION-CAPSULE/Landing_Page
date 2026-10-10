import { useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { SURVEY_GROUPS, SURVEY_WISH_LIMIT, type SurveyAnswers } from '../data/survey.ts'
import FunnelHeader from '../components/FunnelHeader.tsx'
import arrow from '../assets/story/cta-arrow.svg'

type Props = {
  answers: SurveyAnswers
  onAnswersChange: Dispatch<SetStateAction<SurveyAnswers>>
  reservationReady: boolean
  onSubmitAnswers: (answers: SurveyAnswers) => Promise<void>
  onOpenPreorder: () => void
  onBack: () => void
}

export default function SurveyPage({ answers, onAnswersChange, reservationReady, onSubmitAnswers, onOpenPreorder, onBack }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const submittingRef = useRef(false)
  const mountedRef = useRef(true)
  const hasAnswer = Object.values(answers.picks).some((picked) => picked.size > 0) || answers.wish.trim() !== ''

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const previous = document.title
    document.title = '설문조사 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

  // Every group allows several picks.
  const toggle = (groupId: string, label: string) => {
    onAnswersChange((current) => {
      const next = new Set(current.picks[groupId])
      if (!next.delete(label)) next.add(label)
      return { ...current, picks: { ...current.picks, [groupId]: next } }
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasAnswer || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmitAnswers(answers)
    } catch {
      if (mountedRef.current) setSubmitError('의견을 보내지 못했어요. 답변은 유지되니 다시 시도해주세요.')
    } finally {
      submittingRef.current = false
      if (mountedRef.current) setSubmitting(false)
    }
  }

  if (!reservationReady) {
    return (
      <main className="survey">
        <FunnelHeader current={2} onBack={onOpenPreorder} showProgress={false} backLabel="사전예약으로 돌아가기" />
        <header className="survey__header">
          <h1 className="survey__title"><span>먼저 사전예약하고</span><span className="accent">나만의 세계를 만들어요</span></h1>
          <p className="survey__lead">예약 완료 화면에서 원하는 캐릭터를 알려줄 수 있어요.</p>
        </header>
        <button type="button" className="cta form-submit" onClick={onOpenPreorder}>사전예약하러 가기</button>
      </main>
    )
  }

  return (
    <main className="survey">
      {/* 5. Character survey (Figma 160:354) */}
      <FunnelHeader current={2} onBack={onBack} disabled={submitting} showProgress={false} backLabel="예약 완료 화면으로 돌아가기" />

      <header className="survey__header">
        <h1 className="survey__title">
          <span>어떤 캐릭터랑</span>
          <span className="accent">공부하고 싶어요?</span>
        </h1>
        <p className="survey__lead">
          원하는 캐릭터를 알려주세요.<br />
          다음 스터디룸 기획에 반영할게요.
        </p>
      </header>

      <form className="survey__form" onSubmit={handleSubmit} aria-busy={submitting}>
        <fieldset className="survey__fields" disabled={submitting}>
          <div className="survey__groups">
            {SURVEY_GROUPS.map((group, groupIndex) => (
              <div className="survey__group" key={group.id} role="group" aria-labelledby={`survey-${group.id}`}>
                <div className="survey__group-head">
                  <h2 className="survey__group-title" id={`survey-${group.id}`}>{group.title}</h2>
                  {groupIndex === 0 && <p className="survey__note">복수 선택 가능</p>}
                </div>
                <div className="survey__rows">
                  {group.rows.map((row, i) => (
                    <div className="survey__row" key={i}>
                      {row.map((option) => (
                        <button
                          type="button"
                          key={option.label}
                          className={`chip-toggle${option.compact ? ' chip-toggle--compact' : ''}`}
                          id={`survey-${group.id}-${option.label}`}
                          aria-pressed={answers.picks[group.id]?.has(option.label) ?? false}
                          onClick={() => toggle(group.id, option.label)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <label className="survey__wish">
            <span className="survey__wish-label">같이 공부하고 싶은 캐릭터를 자유롭게 적어주세요</span>
            <textarea
              className="survey__wish-input"
              name="characterWish"
              maxLength={SURVEY_WISH_LIMIT}
              aria-describedby="survey-wish-hint"
              placeholder="예: 나 혼자만 좋아하는 학생회 선배"
              value={answers.wish}
              onChange={(event) => onAnswersChange((current) => ({ ...current, wish: event.target.value }))}
            />
            <span className="field__meta">
              <span id="survey-wish-hint">선택 입력 · 최대 {SURVEY_WISH_LIMIT}자</span>
              <span aria-hidden="true">{answers.wish.length}/{SURVEY_WISH_LIMIT}</span>
            </span>
          </label>

          <button type="submit" className="cta form-submit" id="survey-submit" disabled={!hasAnswer || submitting}>
            <span>{submitting ? '의견 보내는 중…' : submitError ? '다시 시도하기' : '의견 보내기'}</span>
            <img className="cta__arrow form-submit__arrow" src={arrow} alt="" width={24} height={24} />
          </button>

          <button type="button" className="survey__skip" id="survey-skip" onClick={onBack}>
            완료 화면으로 돌아가기
          </button>
        </fieldset>
        <p className="form-feedback" role="status">{submitError}</p>
      </form>
    </main>
  )
}
