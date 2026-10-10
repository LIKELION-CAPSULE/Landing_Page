import { useId } from 'react'
import RoomSelectPreview from './RoomSelectPreview.tsx'
import StudySessionPreview from './StudySessionPreview.tsx'
import { useDemoPlayback } from '../hooks/useDemoPlayback.ts'
import { useDemoCanvas } from '../hooks/useDemoCanvas.ts'
import { DEMO_PHASE_IMAGES } from '../data/study-session.ts'
import cursor from '../assets/story/room-select/cursor.svg'
import './StepDemo.css'

const TIMELINES = {
  1: [900, 1100, 1100, 1000, 1000, 3000, 3000, 1200],
  2: [900, 1400, 900, 2400, 1400],
  3: [900, 1400, 3000, 3000, 3200, 1600, 2400],
} as const

const DESCRIPTIONS = {
  1: ['클릭해서 룸 선택 과정을 보세요', '마음에 드는 룸을 선택해요', '선택한 룸으로 입장해 보세요', '스터디룸에 입장해요', '호감도 0에서 공부를 시작해요', '함께 공부한 시간이 쌓여요', '공부 시간이 늘수록 호감도도 올라요', '이제 캐릭터와 함께 공부해요'],
  2: ['클릭해서 캐릭터 반응을 보세요', '폰에 눈길이 갔네요', '캐릭터가 눈치채고 고개를 들어요', '캐릭터가 말을 걸어요', '다시 공부를 이어가요'],
  3: ['함께 공부할수록 호감도가 올라요', '함께 공부한 시간이 쌓여요', '강채린이 말을 걸어요', '한수아도 말을 걸어요', '류다희가 이어폰을 건네요', '호감도 100을 달성해 다음 에피소드가 열렸어요', '둘만의 다음 이야기가 시작돼요'],
} as const

const ACTIONS = {
  1: ['스터디룸 선택 시연하기', '스터디룸 선택 시연하기', '선택한 스터디룸 입장 시연하기', '공부 시작 시연하기', '공부 시간 쌓기', '호감도 증가 확인하기', '전체 스터디룸 보기', '룸 선택 시연 다시 시작하기'],
  2: ['폰 확인하기', '캐릭터 반응 확인하기', '캐릭터의 말 듣기', '공부로 돌아가기', '캐릭터 반응 시연 다시 시작하기'],
  3: ['공부 시간 쌓기', '강채린의 말 듣기', '한수아의 말 듣기', '류다희의 말 듣기', '열린 에피소드 확인하기', '다음 에피소드 열기', '호감도 시연 다시 시작하기'],
} as const

export default function StepDemo({ step }: { step: 1 | 2 | 3 }) {
  const { ref, phase, progress, running, playing, reduced, pending, near, loadedImages, advance, toggle } = useDemoPlayback(TIMELINES[step], DEMO_PHASE_IMAGES[step])
  const { stageRef, canvasRef } = useDemoCanvas()
  const descriptionId = useId()
  const last = phase === TIMELINES[step].length - 1
  const toggleLabel = reduced ? '다음 장면 보기' : playing ? '시연 일시정지' : last ? '시연 다시 재생' : '시연 재생'

  return (
    <div className="step-demo" ref={ref} data-step={step} data-phase={phase} data-entered={step === 1 && phase >= 4 || undefined} data-running={running || undefined} data-pending={pending || undefined}>
      <button type="button" className="step__media demo__stage" ref={stageRef} aria-label={ACTIONS[step][phase]} aria-describedby={descriptionId} onClick={advance}>
        <div className="demo__canvas" ref={canvasRef}>
          <div className="demo__scene">
            {step === 1 ? (
              <>
                <div className="demo__selection" aria-hidden="true"><RoomSelectPreview selected={phase >= 2} loadImages={near} /></div>
                <div className="demo__entered" aria-hidden="true"><StudySessionPreview mode="study" phase={phase} progress={progress} loadedImages={loadedImages} /></div>
              </>
            ) : <StudySessionPreview mode={step === 2 ? 'reaction' : 'affection'} phase={phase} progress={progress} loadedImages={loadedImages} />}
            {step === 1 && phase < 3 && <><span className="demo__cursor" aria-hidden="true"><img src={cursor} alt="" /></span><span className="demo__click" aria-hidden="true"></span></>}
          </div>
        </div>
      </button>
      <p className="sr-only" id={descriptionId}>{DESCRIPTIONS[step][phase]}</p>
      <button type="button" className="demo__play" aria-label={toggleLabel} onClick={toggle}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          {playing && !reduced ? <path d="M8 6v12M16 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : last && !reduced ? <path d="M5 9a8 8 0 1 1-1 7M5 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : <path d="m9 5 10 7-10 7V5Z" fill="currentColor" />}
        </svg>
      </button>
    </div>
  )
}
