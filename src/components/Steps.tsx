import { Fragment } from 'react'
import StepDemo from './StepDemo.tsx'

type Step = {
  label: string
  name: string
  desc: [string, string]
}

const STEPS: Step[] = [
  {
    label: 'STEP 1',
    name: '스터디룸 선택하기',
    desc: ['캐릭터를 고르고 캠을 켜면,', '같이 공부를 시작해요.'],
  },
  {
    label: 'STEP 2',
    name: '딴짓하면 반응과 상호작용',
    desc: ['폰을 보면 캐릭터가 고개를 들어', '말을 걸어요. 혼내지 않고 장난스럽게.'],
  },
  {
    label: 'STEP 3',
    name: '호감도 누적',
    desc: ['공부한 시간만큼 가까워지고,', '새 대사와 에피소드가 열려요.'],
  },
]

export default function Steps() {
  return (
    <section className="steps" aria-labelledby="steps-title">
      <h2 className="steps__title" id="steps-title" data-reveal><span className="accent">캡슐</span>은 이렇게 돌아가요</h2>

      {STEPS.map((step, index) => (
        <Fragment key={step.label}>
          <article className={`step step--${index + 1}`} data-reveal>
            <div className="step__text">
              <p className="step__label">{step.label}</p>
              <h3 className="step__name">{step.name}</h3>
              <p className="step__desc">{step.desc[0]}<br />{step.desc[1]}</p>
            </div>
            <StepDemo step={(index + 1) as 1 | 2 | 3} />
          </article>
          <div className="divider" aria-hidden="true" />
        </Fragment>
      ))}
    </section>
  )
}
