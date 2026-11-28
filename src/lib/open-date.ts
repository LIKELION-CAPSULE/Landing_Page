// The opening moment and the CTA rule, free of imports so Node's test runner reads it directly
// (tests/cta.test.ts). lib/cta.ts adds the browser parts (QA override, attribution, analytics).

/** 2026-12-01 00:00 KST. */
export const OPEN_AT = Date.parse('2026-12-01T00:00:00+09:00')

export type CtaState = 'before_open' | 'preparing' | 'open'
export type CtaPhase = 'before' | 'after'

export const phaseAt = (now: number): CtaPhase => (now < OPEN_AT ? 'before' : 'after')

/** Before the date: locked. After: a link only with a valid app address, otherwise 「오픈 준비 중」. */
export const stateAt = (now: number, appReady: boolean): CtaState => (now < OPEN_AT ? 'before_open' : appReady ? 'open' : 'preparing')

/** Only an absolute http(s) URL counts; an address without a path goes to the app's /login. */
export function parseAppUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (url.pathname === '/' || url.pathname === '') url.pathname = '/login'
    return url.href
  } catch {
    return null
  }
}
