export default function FunnelProgress({ current, complete = false }: { current: 1 | 2; complete?: boolean }) {
  const progress = complete ? 100 : current === 1 ? 33 : 67
  const label = complete ? '사전예약 완료' : current === 1 ? '룸 선택 중' : '사전예약 입력 중'
  return (
    <div
      className="funnel-progress"
      role="progressbar"
      aria-label="사전예약 진행 상황"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-valuetext={label}
    >
      <span className="funnel-progress__fill" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  )
}
