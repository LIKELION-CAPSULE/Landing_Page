import { track } from './analytics.ts'

export const OPEN_AT = new Date('2026-12-01T00:00:00+09:00').getTime()
export const MOBILE_QUERY = '(max-width: 767px)'

export type CtaState = 'before_open' | 'preparing' | 'open'

// QA switches exist only in local dev and Vercel preview builds, never in production.
// VITE_VERCEL_ENV comes from Vercel's automatically exposed system variables.
const QA_BUILD = import.meta.env.DEV || import.meta.env.VITE_VERCEL_ENV === 'preview'

// Only an absolute http(s) URL counts. Anything else (empty, typo, relative path) is treated
// as missing, so the button stays "오픈 준비 중" instead of linking somewhere broken.
function parseAppUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

const APP_URL = parseAppUrl(import.meta.env.VITE_APP_URL)
// The hard-coded app address is a QA convenience only; production needs a valid VITE_APP_URL.
const APP_TARGET = APP_URL ?? (QA_BUILD ? 'https://capsule-front-web.vercel.app/login' : null)

// Opens only when the date has passed AND the app URL is valid, so the button never
// points at a service page that is not ready yet. Set VITE_APP_URL in Vercel and redeploy to open.
// QA override (dev/preview only): ?cta=before | preparing | open
export function ctaState(now: Date | number = Date.now()): CtaState {
  const override = QA_BUILD ? new URLSearchParams(window.location.search).get('cta') : null
  if (override === 'open') return APP_TARGET ? 'open' : 'preparing'
  if (override === 'before') return 'before_open'
  if (override === 'preparing') return 'preparing'
  if (Number(now) < OPEN_AT) return 'before_open'
  return APP_URL ? 'open' : 'preparing'
}

// utm_* and ref travel with every link we hand out (app login or landing share).
function withAttribution(target: URL): string {
  const incoming = new URLSearchParams(window.location.search)
  // Preserve repeated parameters and their complete values; only attribution travels.
  const keys = new Set([...incoming.keys()].filter(key => key.startsWith('utm_') || key === 'ref'))
  keys.forEach(key => target.searchParams.delete(key))
  incoming.forEach((value, key) => { if (keys.has(key)) target.searchParams.append(key, value) })
  return target.href
}

// null when no usable address exists; callers then render the locked button, never a link.
export function appUrl(): string | null {
  return APP_TARGET ? withAttribution(new URL(APP_TARGET)) : null
}

// Phones get the landing page itself: it works before the app is ready, and on PC
// its own button then shows the right state.
export function landingShareUrl(): string {
  return withAttribution(new URL('/', window.location.origin))
}

export function isMobile(): boolean {
  // Match the landing's 767px phone layout. Coarse pointers also occur on PC-sized
  // touch laptops/tablets, so pointer type alone must not hide the desktop app link.
  return window.matchMedia(MOBILE_QUERY).matches
}

export type PcLinkResult = { method: 'share' | 'clipboard' | 'manual'; url: string } | { method: 'dismissed' }

export async function copyPcLink(): Promise<PcLinkResult> {
  const url = landingShareUrl()
  if (navigator.share) {
    try {
      await navigator.share({ title: '캡슐 CAPSULE', url })
      track('pc_link_copied', { method: 'share' })
      return { method: 'share', url }
    } catch (error) {
      // Closing the OS share sheet is an intentional dismissal, not a copy request.
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return { method: 'dismissed' }
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    track('pc_link_copied', { method: 'clipboard' })
    return { method: 'clipboard', url }
  } catch {
    // The caller renders this URL as selectable text when both APIs fail.
    return { method: 'manual', url }
  }
}
