import CheckIcon from './CheckIcon.tsx'

const STEPS = ['룸 선택', '취향 조사', '사전예약']

export default function FunnelProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="funnel-progress" aria-label="사전예약 진행 단계">
      {STEPS.map((label, index) => (
        <li key={label} aria-current={index + 1 === current ? 'step' : undefined} data-past={index + 1 < current || undefined}>
          <span className="funnel-progress__number" aria-hidden="true">
            {index + 1 < current ? <CheckIcon /> : index + 1}
          </span>
          <span>{label}</span>
          {index === 1 && <span className="sr-only">(선택사항)</span>}
        </li>
      ))}
    </ol>
  )
}
