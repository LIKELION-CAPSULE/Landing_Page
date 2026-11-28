import { useState, useSyncExternalStore } from 'react'
import { APP_READY, APP_TARGET, appUrl, copyPcLink, type CtaState, type PcLinkResult } from '../../lib/cta.ts'
import { track } from '../../lib/analytics.ts'
import { usePhone } from '../../hooks/usePhone.ts'

const subscribeNever = () => () => {}

type Variant = 'open' | 'share' | 'before' | 'preparing'

export const OPEN_LABEL = '지금 시작하기'

function variantOf(state: CtaState, phone: boolean): Variant {
  if (phone) return state === 'before_open' ? 'before' : 'share'
  return state === 'open' ? 'open' : state === 'before_open' ? 'before' : 'preparing'
}

// Every label is rendered in one grid cell; only the active one is visible. The cell is as wide as the
// widest label, so switching state (at midnight KST, or after hydration) never moves the layout.
// Before mount (prerendered HTML) the active label is chosen by CSS from <html data-cta-phase>, <html data-device>
// (both set by index.html's inline script) and `data-app-ready` (a build-time fact), so the right label shows on
// first paint. Phone or PC is the app's own rule (lib/device.ts), not the 767px layout breakpoint.
export default function CallCta({ placement, state, openLabel = OPEN_LABEL }: { placement: 'header' | 'hero' | 'final' | 'not_found'; state: CtaState | null; openLabel?: string }) {
  const phone = usePhone()
  const [result, setResult] = useState<PcLinkResult | null>(null)
  const [pending, setPending] = useState(false)
  // Prerender: the bare app address (works before hydration once open). After mount: with utm_*/ref.
  const href = useSyncExternalStore(subscribeNever, appUrl, () => APP_TARGET)
  const active: Variant | 'pending' = state ? variantOf(state, phone) : 'pending'
  const clicked = () => track('cta_clicked', { cta: placement, state: state ?? 'before_open', device: phone ? 'mobile' : 'desktop' })
  const send = async () => {
    if (pending) return
    clicked()
    setResult(null)
    setPending(true)
    try { setResult(await copyPcLink()) } finally { setPending(false) }
  }
  const hidden = (variant: Variant) => (active !== 'pending' && active !== variant) || undefined

  return (
    <div className={`call-cta call-cta--${placement}`} data-cta-state={state ?? 'pending'}>
      <div className="call-cta__slot" data-active={active} data-app-ready={APP_READY || undefined}>
        <a data-variant="open" href={active === 'open' || active === 'pending' ? href ?? undefined : undefined} aria-hidden={hidden('open')} tabIndex={hidden('open') && -1} onClick={clicked}>{openLabel}</a>
        <button type="button" data-variant="share" aria-hidden={hidden('share')} tabIndex={hidden('share') && -1} aria-busy={pending} onClick={() => { void send() }}>PC로 링크 보내기</button>
        <button type="button" data-variant="before" aria-hidden={hidden('before')} tabIndex={hidden('before') && -1} aria-disabled="true" onClick={clicked}>12월 1일 오픈</button>
        <button type="button" data-variant="preparing" aria-hidden={hidden('preparing')} tabIndex={hidden('preparing') && -1} aria-disabled="true" onClick={clicked}>오픈 준비 중</button>
      </div>
      {placement !== 'header' && <p className="call-cta__device">캡슐은 PC에서 만날 수 있어요</p>}
      <div className="call-cta__status" role="status">
        {result?.method === 'clipboard' && '링크를 복사했어요. PC에서 열어 주세요.'}
        {result?.method === 'share' && '링크를 보냈어요.'}
        {result?.method === 'manual' && <><span>아래 링크를 직접 복사해 주세요.</span><a data-pc-link href={result.url}>{result.url}</a></>}
      </div>
    </div>
  )
}

/** Copy that depends on the opening date: both are prerendered; CSS shows one (html[data-cta-phase]). */
export function PhaseText({ before, after }: { before: string; after: string }) {
  return <><span data-phase-only="before">{before}</span><span data-phase-only="after">{after}</span></>
}
