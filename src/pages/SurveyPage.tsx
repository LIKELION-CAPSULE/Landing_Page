import { useEffect, useState, type FormEvent } from 'react'
import { SURVEY_GROUPS } from '../data/survey.ts'
import arrow from '../assets/story/cta-arrow.svg'
import skipUnderline from '../assets/survey/skip-underline.svg'

type Answers = Record<string, ReadonlySet<string>>

type Props = {
  onBack: () => void
}

export default function SurveyPage({ onBack }: Props) {
  const [answers, setAnswers] = useState<Answers>({})
  const [wish, setWish] = useState('')

  useEffect(() => {
    const previous = document.title
    document.title = '캐릭터 수요조사 · 캡슐 CAPSULE'
    return () => {
      document.title = previous
    }
  }, [])

  // Every group allows several picks.
  const toggle = (groupId: string, label: string) => {
    setAnswers((current) => {
      const next = new Set(current[groupId])
      if (!next.delete(label)) next.add(label)
      return { ...current, [groupId]: next }
    })
  }

  // TODO: hook up to the pre-registration step once it's designed.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <main className="survey">
      {/* 5. Character survey (Figma 160:354) */}
      <button type="button" className="page-back" aria-label="뒤로 가기" onClick={onBack}>
        <img src={arrow} alt="" width={24} height={24} />
      </button>

      <header className="survey__header">
        <h1 className="survey__title">
          <span>어떤 캐릭터랑</span>
          <span className="accent">공부하고 싶어요?</span>
        </h1>
        <p className="survey__lead">
          현재 앞으로 개발할 스터디룸을 수요조사 중이에요<br />
          원하는 캐릭터를 알려주시면 만들어드릴게요
        </p>
      </header>

      <form className="survey__form" onSubmit={handleSubmit}>
        <ul className="survey__note">
          <li>복수 선택 가능</li>
        </ul>

        <div className="survey__groups">
          {SURVEY_GROUPS.map((group) => (
            <div className="survey__group" key={group.id} role="group" aria-labelledby={`survey-${group.id}`}>
              <h2 className="survey__group-title" id={`survey-${group.id}`}>{group.title}</h2>
              <div className="survey__rows">
                {group.rows.map((row, i) => (
                  <div className="survey__row" key={i}>
                    {row.map((option) => (
                      <button
                        type="button"
                        key={option.label}
                        className={`chip-toggle${option.compact ? ' chip-toggle--compact' : ''}`}
                        aria-pressed={answers[group.id]?.has(option.label) ?? false}
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
            placeholder="예: 나 혼자만 좋아하는 학생회 선배"
            value={wish}
            onChange={(event) => setWish(event.target.value)}
          />
        </label>

        <button type="submit" className="cta survey__submit">
          <span>사전예약 완료하기</span>
          <img className="cta__arrow survey__submit-arrow" src={arrow} alt="" width={24} height={24} />
        </button>

        <button type="button" className="survey__skip">
          <span>건너뛰고 사전 예약하기</span>
          <img src={skipUnderline} alt="" width={115.017} height={1} />
        </button>
      </form>
    </main>
  )
}
