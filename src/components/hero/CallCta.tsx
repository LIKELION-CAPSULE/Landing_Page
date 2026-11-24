import { useState } from 'react'
import { appUrl, copyPcLink, type CtaState, type PcLinkResult } from '../../lib/cta.ts'
import { track } from '../../lib/analytics.ts'

const LOCKED_LABEL: Record<Exclude<CtaState, 'open'>, string> = {
  before_open: '12월 1일 오픈',
  preparing: '오픈 준비 중',
}
const MOBILE_NOTE: Record<CtaState, string> = {
  before_open: '캡슐은 PC에서 만날 수 있어요',
  preparing: '곧 PC에서 만날 수 있어요',
  open: '캡슐은 PC에서 만날 수 있어요',
}

export default function CallCta({ placement, state, mobile }: { placement: 'header' | 'hero' | 'final'; state: CtaState; mobile: boolean }) {
  const [result, setResult] = useState<PcLinkResult | null>(null)
  const [pending, setPending] = useState(false)
  // Defensive: a link renders only with a usable app address (lib/cta.ts keeps 'open' in sync).
  const href = !mobile && state === 'open' ? appUrl() : null
  const locked: Exclude<CtaState, 'open'> = state === 'open' ? 'preparing' : state
  const clicked = () => track('cta_clicked', { cta: placement, state, device: mobile ? 'mobile' : 'desktop' })
  const send = async () => {
    if (pending) return
    clicked()
    setResult(null)
    setPending(true)
    try { setResult(await copyPcLink()) } finally { setPending(false) }
  }

  return (
    <div className={`call-cta call-cta--${placement}`} data-cta-state={state}>
      {/* Phones share the landing link, but only from 12/1 on, same as the desktop button. */}
      {mobile && state !== 'before_open' ? <button type="button" aria-busy={pending} onClick={() => { void send() }}>PC로 링크 보내기</button>
        : href ? <a href={href} onClick={clicked}>채린이 깨우러 가기</a>
          // Desktop before opening/while preparing, or a phone before 12/1.
          : <button type="button" aria-disabled="true" onClick={clicked}>{LOCKED_LABEL[locked]}</button>}
      {mobile && <p className="call-cta__device">{MOBILE_NOTE[state]}</p>}
      <div className="call-cta__status" role="status">
        {result?.method === 'clipboard' && '링크를 복사했어요. PC에서 열어 주세요.'}
        {result?.method === 'share' && '링크를 보냈어요'}
        {result?.method === 'manual' && <><span>아래 링크를 직접 복사해 주세요.</span><a data-pc-link href={result.url}>{result.url}</a></>}
      </div>
    </div>
  )
}
