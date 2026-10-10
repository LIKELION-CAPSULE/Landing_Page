import type { RefObject } from 'react'
import { MACBOOK_PREVIEW_URL } from './macbook-config.ts'

type Props = { completionRef: RefObject<HTMLDivElement | null>; onReset: () => void }

// Replace this component's content with the real DOM experience when ready.
export default function MacbookCompletionScreen({ completionRef, onReset }: Props) {
  return (
    <div className="macbook-test__completion" ref={completionRef} aria-hidden="true" inert>
      <img className="macbook-test__completion-image" src={MACBOOK_PREVIEW_URL} alt="캡슐 스터디룸 프리뷰" width={1360} height={880} />
      <section className="macbook-test__completion-card" aria-labelledby="macbook-complete-title">
        <span className="macbook-test__completion-label">REACT DOM · TRANSITION COMPLETE</span>
        <h2 id="macbook-complete-title">MacBook Animation Complete</h2>
        <p>3D 디스플레이에서 일반 웹 화면으로 연결됐어요.<br />위로 스크롤하면 다시 맥북으로 돌아갑니다.</p>
        <button type="button" onClick={onReset}>처음부터 다시 보기 <span aria-hidden="true">↗</span></button>
      </section>
    </div>
  )
}
