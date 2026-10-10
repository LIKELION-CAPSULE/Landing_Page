import type { MacbookLoadStatus, MacbookSnapshot } from './macbook-config.ts'

type Props = {
  snapshot: MacbookSnapshot
  status: MacbookLoadStatus
  paused: boolean
  reducedMotion: boolean
  onPause: () => void
  onReset: () => void
}

export default function MacbookDebugPanel({ snapshot, status, paused, reducedMotion, onPause, onReset }: Props) {
  const statusText = status === 'ready' ? '준비 완료' : status === 'error' ? '오류' : '불러오는 중'
  return (
    <aside className="macbook-test__debug" aria-label="MacBook 애니메이션 디버그">
      <div className="macbook-test__debug-heading">
        <strong>Animation lab</strong>
        <span className={`macbook-test__status macbook-test__status--${status}`} role="status">{statusText}</span>
      </div>
      <dl>
        <div><dt>ScrollTrigger</dt><dd data-testid="macbook-progress">{(snapshot.scrollProgress * 100).toFixed(1)}%</dd></div>
        <div><dt>힌지 열림</dt><dd data-testid="macbook-angle">{snapshot.hingeDegrees.toFixed(1)}°</dd></div>
        <div><dt>공중 높이</dt><dd>{snapshot.height.toFixed(2)}m</dd></div>
        <div><dt>Y축 회전차</dt><dd>{snapshot.rotationDegrees.toFixed(0)}°</dd></div>
        <div><dt>현재 단계</dt><dd data-testid="macbook-stage">{snapshot.stage}</dd></div>
      </dl>
      <div className="macbook-test__debug-progress" aria-hidden="true"><span style={{ width: `${snapshot.animationProgress * 100}%` }} /></div>
      <div className="macbook-test__debug-actions">
        <button type="button" onClick={onPause} disabled={status !== 'ready' || reducedMotion} aria-pressed={paused}>
          {paused ? '재개' : '일시정지'}
        </button>
        <button type="button" onClick={onReset} disabled={status !== 'ready'}>초기화</button>
      </div>
      {reducedMotion && <p className="macbook-test__motion-note">모션 줄이기 설정 · 스크롤 애니메이션 생략</p>}
    </aside>
  )
}
