import FunnelProgress from './FunnelProgress.tsx'
import arrow from '../assets/story/cta-arrow.svg'

type Props = {
  current: 1 | 2
  onBack: () => void
  disabled?: boolean
  backLabel?: string
  showProgress?: boolean
  complete?: boolean
}

export default function FunnelHeader({ current, onBack, disabled = false, backLabel = '뒤로 가기', showProgress = true, complete = false }: Props) {
  return (
    <div className="funnel-header">
      <button type="button" className="page-back" aria-label={backLabel} disabled={disabled} onClick={onBack}>
        <img src={arrow} alt="" width={24} height={24} />
      </button>
      {showProgress && <FunnelProgress current={current} complete={complete} />}
    </div>
  )
}
