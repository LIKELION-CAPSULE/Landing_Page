import { useState } from 'react'
import { appUrl, copyPcLink, type PcLinkResult } from '../../lib/cta.ts'
import { track } from '../../lib/analytics.ts'

export default function CallCta({ placement, open, mobile }: { placement: 'header' | 'hero' | 'final'; open: boolean; mobile: boolean }) {
  const [result, setResult] = useState<PcLinkResult | null>(null)
  const [pending, setPending] = useState(false)
  const clicked = () => track('cta_clicked', { cta: placement, state: open ? 'open' : 'before_open', device: mobile ? 'mobile' : 'desktop' })
  const copy = async () => {
    if (pending) return
    clicked()
    setResult(null)
    setPending(true)
    try { setResult(await copyPcLink()) } finally { setPending(false) }
  }

  return (
    <div className={`call-cta call-cta--${placement}`} data-cta-state={open ? 'open' : 'before_open'}>
      {mobile ? <button type="button" aria-busy={pending} onClick={() => { void copy() }}>PC에서 열 링크 복사</button>
        : open ? <a href={appUrl()} onClick={clicked}>채린이 깨우러 가기</a>
          : <button type="button" aria-disabled="true" onClick={clicked}>12월 1일 오픈</button>}
      {mobile && <p className="call-cta__device">{open ? '캡슐은 PC에서 만날 수 있어요' : '12월 1일부터 PC에서 만날 수 있어요'}</p>}
      <div className="call-cta__status" role="status">
        {result?.method === 'clipboard' && '링크를 복사했어요'}
        {result?.method === 'share' && '링크를 공유했어요'}
        {result?.method === 'manual' && <><span>아래 링크를 직접 복사해 주세요.</span><a data-pc-link href={result.url}>{result.url}</a></>}
      </div>
    </div>
  )
}
